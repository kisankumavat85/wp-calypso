import { recordTracksEvent } from '@automattic/calypso-analytics';
import { WPCOM_FEATURES_MANAGE_PLUGINS } from '@automattic/calypso-products';
import styled from '@emotion/styled';
import { Button } from '@wordpress/components';
import { useTranslate } from 'i18n-calypso';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import siteHasFeature from 'calypso/state/selectors/site-has-feature';
import { getSiteAdminUrl } from 'calypso/state/sites/selectors';
import { getSelectedSiteId, getSelectedSiteSlug } from 'calypso/state/ui/selectors';

const PluginSectionContainer = styled.div`
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	width: 720px;
	padding: 24px;
	box-sizing: border-box;
	border: 1px solid var( --studio-gray-5 );
	border-radius: 4px;
	align-items: center;

	div {
		min-width: auto;
	}

	@media ( max-width: 740px ) {
		width: 500px;
		gap: 16px;
	}

	@media ( max-width: 520px ) {
		width: 280px;
	}
`;

const PluginSectionContent = styled.div`
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	margin: 0 16px;

	@media ( max-width: 740px ) {
		margin: 0;
	}
`;

const PluginSectionName = styled.div`
	font-size: 16px;
	font-weight: 500;
	line-height: 24px;
	color: var( --studio-gray-100 );
`;

const PluginSectionExpirationDate = styled.div`
	font-size: 14px;
	line-height: 22px;
	color: var( --studio-gray-60 );
`;

const PluginSectionButtons = styled.div`
	display: flex;
	gap: 16px;
	min-width: auto;
`;

export const ThankYouPluginSection = ( { plugin }: { plugin: any } ) => {
	const translate = useTranslate();
	const siteId = useSelector( getSelectedSiteId );
	const siteSlug = useSelector( getSelectedSiteSlug );
	const siteAdminUrl = useSelector( ( state ) => getSiteAdminUrl( state, siteId ) );
	const hasManagePluginsFeature = useSelector( ( state ) =>
		siteHasFeature( state, siteId, WPCOM_FEATURES_MANAGE_PLUGINS )
	);
	const managePluginsUrl = hasManagePluginsFeature
		? `${ siteAdminUrl }plugins.php`
		: `/plugins/${ plugin.slug }/${ siteSlug } `;
	const fallbackSetupUrl =
		plugin?.setup_url && siteAdminUrl ? siteAdminUrl + plugin.setup_url : null;
	const setupURL = plugin?.action_links?.Settings || fallbackSetupUrl || managePluginsUrl;
	const documentationURL = plugin?.documentation_url;

	const sendTrackEvent = useCallback(
		( name: string, link: string ) => {
			recordTracksEvent( name, {
				site_id: siteId,
				plugin: plugin.slug,
				link,
			} );
		},
		[ siteId, plugin ]
	);

	return (
		<PluginSectionContainer>
			<img
				width={ 50 }
				height={ 50 }
				src={ plugin.icon }
				alt={
					translate( "%(plugin)s's icon", {
						args: {
							plugin: plugin.name,
						},
					} ) as string
				}
			/>
			<PluginSectionContent>
				<PluginSectionName>{ plugin.name }</PluginSectionName>
				{ /* TODO: Implement expiration date logic, the prop expiration date doesn't exists */ }
				{ plugin.expirationDate && (
					<PluginSectionExpirationDate>{ plugin.expirationDate }</PluginSectionExpirationDate>
				) }
			</PluginSectionContent>
			<PluginSectionButtons>
				<Button
					isPrimary
					href={ setupURL }
					onClick={ () =>
						sendTrackEvent( 'calypso_plugin_thank_you_manage_plugin_click', setupURL )
					}
				>
					{ translate( 'Manage plugin' ) }
				</Button>
				{ documentationURL && (
					<Button
						isSecondary
						href={ documentationURL }
						onClick={ () =>
							sendTrackEvent( 'calypso_plugin_thank_you_plugin_guide_click', documentationURL )
						}
					>
						{ translate( 'Plugin guide' ) }
					</Button>
				) }
			</PluginSectionButtons>
		</PluginSectionContainer>
	);
};
