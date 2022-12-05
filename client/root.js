import config from '@automattic/calypso-config';
import globalPageInstance from 'page';
import { isUserLoggedIn, getCurrentUser } from 'calypso/state/current-user/selectors';
import { fetchPreferences } from 'calypso/state/preferences/actions';
import { hasReceivedRemotePreferences } from 'calypso/state/preferences/selectors';
import getPrimarySiteId from 'calypso/state/selectors/get-primary-site-id';
import { requestSite } from 'calypso/state/sites/actions';
import { canCurrentUserUseCustomerHome, getSite, getSiteSlug } from 'calypso/state/sites/selectors';
import { hasSitesAsLandingPage } from 'calypso/state/sites/selectors/has-sites-as-landing-page';

/**
 * @param clientRouter Unused. We can't use the isomorphic router because we want to do redirects.
 * @param page Used to create isolated unit tests. Default behaviour uses the global 'page' router.
 */
export default function ( clientRouter, page = globalPageInstance ) {
	page( '/', ( context ) => {
		const isLoggedIn = isUserLoggedIn( context.store.getState() );
		if ( isLoggedIn ) {
			handleLoggedIn( page, context );
		} else {
			handleLoggedOut( page );
		}
	} );
}

function handleLoggedOut( page ) {
	if ( config.isEnabled( 'devdocs/redirect-loggedout-homepage' ) ) {
		page.redirect( '/devdocs/start' );
	} else if ( config.isEnabled( 'jetpack-cloud' ) ) {
		if ( config.isEnabled( 'oauth' ) ) {
			page.redirect( '/connect' );
		}
	}
}

async function handleLoggedIn( page, context ) {
	let redirectPath = await getLoggedInLandingPage( context.store );

	if ( context.querystring ) {
		redirectPath += `?${ context.querystring }`;
	}

	page.redirect( redirectPath );
}

// Helper thunk that ensures that the requested site info is fetched into Redux state before we
// continue working with it.
// The `siteSelection` handler in `my-sites/controller` contains similar code.
const waitForSite = ( siteId ) => async ( dispatch, getState ) => {
	if ( getSite( getState(), siteId ) ) {
		return;
	}

	try {
		await dispatch( requestSite( siteId ) );
	} catch {
		// if the fetching of site info fails, return gracefully and proceed to redirect to Reader
	}
};

// Helper thunk that ensures that the user preferences has been fetched into Redux state before we
// continue working with it.
const waitForPrefs = () => async ( dispatch, getState ) => {
	if ( hasReceivedRemotePreferences( getState() ) ) {
		return;
	}

	try {
		await dispatch( fetchPreferences() );
	} catch {
		// if the fetching of preferences fails, return gracefully and proceed to the next landing page candidate
	}
};

async function getLoggedInLandingPage( { dispatch, getState } ) {
	await dispatch( waitForPrefs() );
	const useSitesAsLandingPage = hasSitesAsLandingPage( getState() );

	const siteCount = getCurrentUser( getState() )?.site_count;

	if ( useSitesAsLandingPage && siteCount > 1 ) {
		return '/sites';
	}

	// determine the primary site ID (it's a property of "current user" object) and then
	// ensure that the primary site info is loaded into Redux before proceeding.
	const primarySiteId = getPrimarySiteId( getState() );
	await dispatch( waitForSite( primarySiteId ) );

	const primarySiteSlug = getSiteSlug( getState(), primarySiteId );

	if ( ! primarySiteSlug ) {
		// there is no primary site or the site info couldn't be fetched. Redirect to Reader.
		return '/read';
	}

	const isCustomerHomeEnabled = canCurrentUserUseCustomerHome( getState(), primarySiteId );

	if ( isCustomerHomeEnabled ) {
		return `/home/${ primarySiteSlug }`;
	}

	return `/stats/${ primarySiteSlug }`;
}
