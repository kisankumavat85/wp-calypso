import { useBlockProps } from '@wordpress/block-editor';
import { BlockEditProps } from '@wordpress/blocks';
import { useEffect } from '@wordpress/element';
import { FunctionComponent } from 'react';
import BlockSettings from './components/block-settings';
import PricingPlans from './components/pricing-plans';
import Skeleton from './components/skeleton';
import usePricingPlans from './hooks/pricing-plans';
import { BlockAttributes } from './types';

export const Edit: FunctionComponent< BlockEditProps< BlockAttributes > > = ( {
	attributes,
	setAttributes,
} ) => {
	const { data: plans, isLoading } = usePricingPlans();
	// Set default values for attributes which are required when rendering the block
	// See https://github.com/WordPress/gutenberg/issues/7342
	useEffect( () => {
		setAttributes( {
			productSlug: attributes.productSlug ?? attributes.defaultProductSlug,
			domain: attributes.domain,
		} );
	}, [ attributes.defaultProductSlug, attributes.domain, attributes.productSlug, setAttributes ] );

	useEffect( () => {
		if ( ! plans.length ) {
			return;
		}

		if ( attributes.planTypeOptions.length > 0 ) {
			return;
		}

		const defaultPlanTypeOption = plans.find(
			( plan ) => plan.productSlug === attributes.productSlug
		);

		setAttributes( {
			planTypeOptions: defaultPlanTypeOption ? [ defaultPlanTypeOption.type ] : [],
		} );
	}, [ attributes.planTypeOptions.length, attributes.productSlug, plans, setAttributes ] );

	useEffect( () => {
		if ( attributes.domain ) {
			return;
		}

		const blogIdSelect: HTMLSelectElement | null =
			document.querySelector( 'select[name="blog_id"]' );

		if ( ! blogIdSelect ) {
			return;
		}

		const updateBlogId = () => {
			const url = blogIdSelect.options[ blogIdSelect.selectedIndex ].text;
			const domain = url.replace( /^https?:\/\//, '' );

			if ( domain !== '--' ) {
				setAttributes( { domain } );
			} else {
				// This needs to be 'false' when unset, see https://github.com/Automattic/wp-calypso/pull/70402#discussion_r1033299970
				setAttributes( { domain: false } );
			}
		};

		updateBlogId();
		blogIdSelect.addEventListener( 'change', updateBlogId );

		return () => {
			blogIdSelect.removeEventListener( 'change', updateBlogId );
		};
	}, [ attributes.domain, setAttributes ] );

	const blockProps = useBlockProps();

	if ( isLoading || ! plans?.length ) {
		return <Skeleton />;
	}

	return (
		<div { ...blockProps }>
			<BlockSettings plans={ plans } attributes={ attributes } setAttributes={ setAttributes } />
			<PricingPlans plans={ plans } attributes={ attributes } setAttributes={ setAttributes } />
		</div>
	);
};
