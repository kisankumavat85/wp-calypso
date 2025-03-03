import { localizeUrl } from '@automattic/i18n-utils';
import { localize } from 'i18n-calypso';
import { Component } from 'react';
import { connect } from 'react-redux';
import PurchaseDetail from 'calypso/components/purchase-detail';
import { getSiteFileModDisableReason } from 'calypso/lib/site/utils';
import { recordTracksEvent } from 'calypso/state/analytics/actions';

class EnhancedDetails extends Component {
	componentDidMount() {
		this.props.trackAutoconfigHalt();
	}

	render() {
		const { selectedSite, trackManualInstall, translate } = this.props;

		if ( ! selectedSite.canUpdateFiles ) {
			return (
				<PurchaseDetail
					icon="cog"
					buttonText={ translate( 'Installation Instructions' ) }
					description={ translate(
						'You can now install Akismet and VaultPress, which will automatically ' +
							'protect your site from spam and data loss. ' +
							"If you have any questions along the way, we're here to help!"
					) }
					href={ localizeUrl( 'https://wordpress.com/support/setting-up-premium-services/' ) }
					onClick={ trackManualInstall }
				/>
			);
		}

		return (
			<PurchaseDetail
				icon="cog"
				buttonText={ translate( 'Set up your plan' ) }
				description={ translate(
					'We are about to install Akismet and VaultPress for your site, ' +
						'which will automatically protect your site from spam ' +
						'and data loss. If you have any questions along the way, ' +
						"we're here to help! You can also perform a manual " +
						'installation by following {{a}}these instructions{{/a}}.',
					{
						components: {
							a: (
								<a
									target="_blank"
									rel="noopener noreferrer"
									href="https://wordpress.com/support/setting-up-premium-services/"
									onClick={ trackManualInstall }
								/>
							),
						},
					}
				) }
				href={ `/plugins/setup/${ selectedSite.slug }` }
			/>
		);
	}
}

const getTracksDataForAutoconfigHalt = ( selectedSite ) => {
	const reasons = getSiteFileModDisableReason( selectedSite, 'modifyFiles' );

	if ( reasons && reasons.length > 0 ) {
		return {
			name: 'calypso_plans_autoconfig_halt_filemod',
			properties: { error: reasons[ 0 ] },
		};
	}

	if ( selectedSite.is_multisite && ! selectedSite.isMainNetworkSite ) {
		return { name: 'calypso_plans_autoconfig_halt_multisite' };
	}

	if ( selectedSite.options.is_multi_network ) {
		return { name: 'calypso_plans_autoconfig_halt_multinetwork' };
	}

	return null;
};

const mapDispatchToProps = ( dispatch, { selectedSite } ) => ( {
	trackAutoconfigHalt: () => {
		const eventData = getTracksDataForAutoconfigHalt( selectedSite );

		if ( ! eventData ) {
			return;
		}

		const { name, properties } = eventData;

		dispatch( recordTracksEvent( name, properties ) );
	},
	trackManualInstall: () => {
		const eventName = selectedSite.canUpdateFiles
			? 'calypso_plans_autoconfig_click_opt_out'
			: 'calypso_plans_autoconfig_click_manual_install';

		dispatch( recordTracksEvent( eventName ) );
	},
} );

export default localize( connect( null, mapDispatchToProps )( EnhancedDetails ) );
