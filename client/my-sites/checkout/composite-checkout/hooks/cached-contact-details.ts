import config from '@automattic/calypso-config';
import { getCountryPostalCodeSupport } from '@automattic/wpcom-checkout';
import { useDispatch } from '@wordpress/data';
import debugFactory from 'debug';
import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch as useReduxDispatch } from 'react-redux';
import { logToLogstash } from 'calypso/lib/logstash';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import { requestContactDetailsCache } from 'calypso/state/domains/management/actions';
import getContactDetailsCache from 'calypso/state/selectors/get-contact-details-cache';
import isRequestingContactDetailsCache from 'calypso/state/selectors/is-requesting-contact-details-cache';
import useCountryList from './use-country-list';
import type { CheckoutStepGroupStore } from '@automattic/composite-checkout';
import type {
	PossiblyCompleteDomainContactDetails,
	CountryListItem,
} from '@automattic/wpcom-checkout';

const debug = debugFactory( 'calypso:composite-checkout:cached-contact-details' );

/**
 * Fetch the cached contact details from the server.
 */
export function useCachedContactDetails( { shouldWait }: { shouldWait?: boolean } ): {
	isLoading: boolean;
	cachedContactDetails: PossiblyCompleteDomainContactDetails | null;
} {
	const reduxDispatch = useReduxDispatch();
	const haveRequestedCachedDetails = useRef< 'not-started' | 'pending' | 'done' >( 'not-started' );
	const cachedContactDetails = useSelector( getContactDetailsCache );
	const isFetching = useSelector( isRequestingContactDetailsCache );
	const [ detailsToReturn, setDetailsToReturn ] =
		useState< PossiblyCompleteDomainContactDetails | null >( null );

	useEffect( () => {
		if ( shouldWait ) {
			debug( 'waiting to fetch cached contact details' );
			return;
		}

		if ( haveRequestedCachedDetails.current === 'not-started' ) {
			debug( 'requesting cached contact details' );
			reduxDispatch( requestContactDetailsCache() );
			haveRequestedCachedDetails.current = 'pending';
			return;
		}

		if ( haveRequestedCachedDetails.current === 'pending' && isFetching === false ) {
			debug( 'cached contact details retrieved' );
			haveRequestedCachedDetails.current = 'done';
			setDetailsToReturn( cachedContactDetails );
			return;
		}
	}, [ reduxDispatch, shouldWait, isFetching, cachedContactDetails ] );

	return {
		isLoading: haveRequestedCachedDetails.current !== 'done',
		cachedContactDetails: detailsToReturn,
	};
}

/**
 * Automatically attempt to populate the checkout contact form and complete the
 * contact step (running validation as normal).
 *
 * Must be run inside a CheckoutStepGroup in order to have the ability to
 * complete steps.
 */
export function useCachedContactDetailsForCheckoutForm( {
	shouldWait,
	cachedContactDetails,
	store,
	overrideCountryList,
}: {
	shouldWait?: boolean;
	cachedContactDetails: PossiblyCompleteDomainContactDetails | null;
	store: CheckoutStepGroupStore;
	overrideCountryList?: CountryListItem[];
} ): { isComplete: boolean } {
	const countriesList = useCountryList( overrideCountryList );
	const reduxDispatch = useReduxDispatch();
	const didFillForm = useRef( false );
	const [ isComplete, setComplete ] = useState( false );

	const arePostalCodesSupported =
		countriesList.length && cachedContactDetails?.countryCode
			? getCountryPostalCodeSupport( countriesList, cachedContactDetails.countryCode )
			: false;

	const checkoutStoreActions = useDispatch( 'wpcom-checkout' );
	if ( ! checkoutStoreActions?.loadDomainContactDetailsFromCache ) {
		throw new Error(
			'useCachedContactDetailsForCheckoutForm must be run after the checkout data store has been initialized'
		);
	}
	const { loadDomainContactDetailsFromCache } = checkoutStoreActions;

	const isMounted = useRef( true );
	useEffect( () => {
		isMounted.current = true;
		return () => {
			isMounted.current = false;
		};
	}, [] );

	// When we have fetched or loaded contact details, send them to the
	// `wpcom-checkout` data store for use by the checkout contact form.
	useEffect( () => {
		// Once this activates, do not do it again.
		if ( didFillForm.current ) {
			return;
		}
		// Do nothing if the contact details are loading, or the countries are loading.
		if ( ! cachedContactDetails ) {
			debug( 'cached contact details for form have not loaded' );
			return;
		}
		if ( ! countriesList.length ) {
			debug( 'cached contact details for form are waiting for the countries list' );
			return;
		}
		if ( shouldWait ) {
			debug( 'cached contact details for form are waiting' );
			return;
		}
		debug( 'using fetched cached contact details for checkout data store', cachedContactDetails );
		didFillForm.current = true;
		// NOTE: the types for `@wordpress/data` actions imply that actions return
		// `void` by default but they actually return `Promise<void>` so I override
		// this type here until the actual types can be improved. See
		// https://github.com/DefinitelyTyped/DefinitelyTyped/pull/60693
		loadDomainContactDetailsFromCache< Promise< void > >( {
			...cachedContactDetails,
			postalCode: arePostalCodesSupported ? cachedContactDetails.postalCode : '',
		} )
			.then( () => {
				if ( ! isMounted.current ) {
					return false;
				}
				if ( cachedContactDetails.countryCode ) {
					debug( 'Contact details are populated; attempting to skip to payment method step' );
					return store.actions.setStepComplete( 'contact-form' );
				}
				return false;
			} )
			.then( ( didSkip: boolean ) => {
				if ( ! isMounted.current ) {
					return false;
				}
				if ( didSkip ) {
					reduxDispatch( recordTracksEvent( 'calypso_checkout_skip_to_last_step' ) );
				}
				setComplete( true );
			} )
			.catch( ( error ) => {
				isMounted.current && setComplete( true );
				// eslint-disable-next-line no-console
				console.error( error );
				logToLogstash( {
					feature: 'calypso_client',
					message: 'composite checkout load error',
					severity: config( 'env_id' ) === 'production' ? 'error' : 'debug',
					extra: {
						env: config( 'env_id' ),
						type: 'checkout_contact_details_autocomplete',
						message: error.message + '; Stack: ' + error.stack,
					},
				} );
			} );
	}, [
		reduxDispatch,
		store,
		cachedContactDetails,
		arePostalCodesSupported,
		loadDomainContactDetailsFromCache,
		countriesList,
		shouldWait,
	] );

	return { isComplete };
}
