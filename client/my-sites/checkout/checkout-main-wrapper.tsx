import config from '@automattic/calypso-config';
import { StripeHookProvider } from '@automattic/calypso-stripe';
import { CheckoutErrorBoundary } from '@automattic/composite-checkout';
import { useTranslate } from 'i18n-calypso';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { logToLogstash } from 'calypso/lib/logstash';
import { captureException } from 'calypso/lib/sentry';
import { getStripeConfiguration } from 'calypso/lib/store-transactions';
import Recaptcha from 'calypso/signup/recaptcha';
import { getCurrentUserLocale } from 'calypso/state/current-user/selectors';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';
import CalypsoShoppingCartProvider from './calypso-shopping-cart-provider';
import CheckoutMain from './composite-checkout/components/checkout-main';
import PrePurchaseNotices from './composite-checkout/components/prepurchase-notices';

const logCheckoutError = ( error: Error ) => {
	logToLogstash( {
		feature: 'calypso_client',
		message: 'composite checkout load error',
		severity: config( 'env_id' ) === 'production' ? 'error' : 'debug',
		extra: {
			env: config( 'env_id' ),
			type: 'checkout_system_decider',
			message: error.message + '; Stack: ' + error.stack,
		},
	} );
	captureException( error );
};

export default function CheckoutMainWrapper( {
	productAliasFromUrl,
	productSourceFromUrl,
	purchaseId,
	selectedFeature,
	couponCode,
	isComingFromUpsell,
	plan,
	selectedSite,
	redirectTo,
	isLoggedOutCart,
	isNoSiteCart,
	isJetpackCheckout,
	jetpackSiteSlug,
	jetpackPurchaseToken,
	isUserComingFromLoginForm,
	isRenewSubPurchase,
}: {
	productAliasFromUrl?: string;
	productSourceFromUrl?: string;
	purchaseId?: number;
	selectedFeature?: string;
	couponCode?: string;
	isComingFromUpsell?: boolean;
	plan?: string;
	selectedSite?: { slug?: string };
	redirectTo?: string;
	isLoggedOutCart?: boolean;
	isNoSiteCart?: boolean;
	isJetpackCheckout?: boolean;
	jetpackSiteSlug?: string;
	jetpackPurchaseToken?: string;
	isUserComingFromLoginForm?: boolean;
	isRenewSubPurchase?: boolean;
} ) {
	const translate = useTranslate();
	const locale = useSelector( getCurrentUserLocale );
	const selectedSiteId = useSelector( getSelectedSiteId ) ?? undefined;

	const prepurchaseNotices = <PrePurchaseNotices />;

	useEffect( () => {
		if ( productAliasFromUrl ) {
			logToLogstash( {
				feature: 'calypso_client',
				message: 'CheckoutMainWrapper saw productSlug to add',
				severity: config( 'env_id' ) === 'production' ? 'error' : 'debug',
				extra: {
					productSlug: productAliasFromUrl,
				},
			} );
		}
	}, [ productAliasFromUrl ] );

	let siteSlug = selectedSite?.slug;

	if ( ! siteSlug ) {
		siteSlug = 'no-site';

		if ( isLoggedOutCart || isNoSiteCart ) {
			siteSlug = 'no-user';
		}
	}

	return (
		<>
			<CheckoutErrorBoundary
				errorMessage={ translate( 'Sorry, there was an error loading this page.' ) }
				onError={ logCheckoutError }
			>
				<CalypsoShoppingCartProvider>
					<StripeHookProvider fetchStripeConfiguration={ getStripeConfiguration } locale={ locale }>
						<CheckoutMain
							siteSlug={ siteSlug }
							siteId={ selectedSiteId }
							productAliasFromUrl={ productAliasFromUrl }
							productSourceFromUrl={ productSourceFromUrl }
							purchaseId={ purchaseId }
							couponCode={ couponCode }
							redirectTo={ redirectTo }
							feature={ selectedFeature }
							plan={ plan }
							isComingFromUpsell={ isComingFromUpsell }
							infoMessage={ prepurchaseNotices }
							isLoggedOutCart={ isLoggedOutCart }
							isNoSiteCart={ isNoSiteCart }
							isJetpackCheckout={ isJetpackCheckout }
							jetpackSiteSlug={ jetpackSiteSlug }
							jetpackPurchaseToken={ jetpackPurchaseToken }
							isUserComingFromLoginForm={ isUserComingFromLoginForm }
							isRenewSubPurchase={ isRenewSubPurchase }
						/>
					</StripeHookProvider>
				</CalypsoShoppingCartProvider>
			</CheckoutErrorBoundary>
			{ isLoggedOutCart && <Recaptcha badgePosition="bottomright" /> }
		</>
	);
}
