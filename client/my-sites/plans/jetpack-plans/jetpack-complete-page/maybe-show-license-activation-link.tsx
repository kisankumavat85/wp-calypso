import { useMobileBreakpoint } from '@automattic/viewport-react';
import classNames from 'classnames';
import { useTranslate } from 'i18n-calypso';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import { getSiteAdminUrl } from 'calypso/state/sites/selectors';
import {
	getUserLicensesCounts,
	hasFetchedUserLicensesCounts,
} from 'calypso/state/user-licensing/selectors';

import './style.scss';

interface Props {
	siteId: number | null;
}

function MaybeShowLicenseActivationLink( { siteId }: Props ) {
	const translate = useTranslate();
	const dispatch = useDispatch();
	const siteAdminUrl = useSelector( ( state ) => getSiteAdminUrl( state, siteId ) );
	const jetpackDashboardUrl = siteAdminUrl + 'admin.php?page=jetpack#/license/activation';
	const userLicensesCounts = useSelector( getUserLicensesCounts );
	const hasFetchedLicensesCounts = useSelector( hasFetchedUserLicensesCounts );
	const hasDetachedLicenses = userLicensesCounts && userLicensesCounts[ 'detached' ] !== 0;
	const isMobile = useMobileBreakpoint();

	useEffect( () => {
		dispatch(
			recordTracksEvent( 'calypso_post_connection_complete_page_license_link_render', {
				site_id: siteId,
			} )
		);
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	const onLinkClick = useCallback( () => {
		dispatch(
			recordTracksEvent( 'calypso_post_connection_complete_page_license_link_clicked', {
				site_id: siteId,
			} )
		);
	}, [ dispatch, siteId ] );

	const StillLoadinglicensesCounts = ! hasFetchedLicensesCounts;

	if ( StillLoadinglicensesCounts && ! userLicensesCounts ) {
		return (
			<div className="maybe-show-license-activation-link__container">
				<div
					className={ classNames( 'maybe-show-license-activation-link', {
						'is-placeholder': StillLoadinglicensesCounts,
					} ) }
				>
					{ isMobile ? (
						<span>Searching for any license keys...</span>
					) : (
						<span>Searching for unused product license keys...</span>
					) }
				</div>
			</div>
		);
	}

	if ( hasDetachedLicenses && siteId ) {
		return (
			<div className="maybe-show-license-activation-link__container">
				<div className="maybe-show-license-activation-link">
					{ isMobile ? (
						<a href={ jetpackDashboardUrl } onClick={ onLinkClick }>
							{ translate( 'Activate license' ) }
						</a>
					) : (
						<>
							<span>{ translate( 'Already have an existing plan or license key? ' ) }</span>
							<span className="licensing-activation-banner__activate">
								<a href={ jetpackDashboardUrl } onClick={ onLinkClick }>
									{ translate( 'Click here to get started' ) }
								</a>
							</span>
						</>
					) }
				</div>
			</div>
		);
	}

	return null;
}

export default MaybeShowLicenseActivationLink;
