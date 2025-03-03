import {
	removeItemFromResponseCart,
	addCouponToResponseCart,
	removeCouponFromResponseCart,
	replaceItemInResponseCart,
	addItemsToResponseCart,
	addLocationToResponseCart,
	doesCartLocationDifferFromResponseCartLocation,
	convertResponseCartToRequestCart,
	convertRawResponseCartToResponseCart,
} from '../src/cart-functions';

const cart = {
	products: [],
	total_tax_integer: 0,
	total_tax_display: '$0',
	total_cost_integer: 0,
	total_cost_display: '$0',
	currency: 'USD',
	credits_integer: 0,
	credits_display: '$0',
	allowed_payment_methods: [],
	coupon: '',
	is_coupon_applied: false,
	coupon_discounts_integer: [],
	locale: 'en-us',
	tax: {
		location: {},
		display_taxes: false,
	},
};

const product1 = {
	product_slug: 'moo',
	product_id: 25,
	uuid: '09',
};
const product2 = {
	product_slug: 'moof',
	product_id: 88,
	uuid: '08',
};
const product3 = {
	product_slug: 'hello',
	product_id: 15,
	uuid: '10',
};

describe( 'replaceItemInResponseCart', function () {
	it( 'replaces an item in the cart with a matching uuid', function () {
		const product1B = { ...product3, uuid: product1.uuid };
		const result = replaceItemInResponseCart(
			{ ...cart, products: [ product1, product2 ] },
			product1.uuid,
			product1B
		);
		expect( result ).toEqual( { ...cart, products: [ product1B, product2 ] } );
	} );
	it( 'does nothing if there is no matching uuid', function () {
		const result = replaceItemInResponseCart(
			{ ...cart, products: [ product1, product2 ] },
			'22',
			product3
		);
		expect( result ).toEqual( { ...cart, products: [ product1, product2 ] } );
	} );
} );

describe( 'addItemsToResponseCart', function () {
	it( 'adds the requested item to the product list', function () {
		const result = addItemsToResponseCart( { ...cart, products: [ product1, product2 ] }, [
			product3,
		] );
		const product3B = { ...product3 }; // Make a copy
		expect( result.products[ 0 ] ).toEqual( product1 );
		expect( result.products[ 1 ] ).toEqual( product2 );
		expect( result.products[ 2 ] ).toEqual( product3B );
	} );
} );

describe( 'addLocationToResponseCart', function () {
	it( 'adds the new location countryCode if set', function () {
		const result = addLocationToResponseCart( cart, { countryCode: 'US' } );
		expect( result.tax.location ).toEqual( {
			country_code: 'US',
			postal_code: undefined,
			subdivision_code: undefined,
			vat_id: undefined,
			organization: undefined,
		} );
	} );
	it( 'resets existing codes not replaced', function () {
		const result = addLocationToResponseCart(
			{ ...cart, tax: { ...cart.tax, location: { ...cart.tax.location, postal_code: '10001' } } },
			{ countryCode: 'US' }
		);
		expect( result.tax.location ).toEqual( {
			country_code: 'US',
			postal_code: undefined,
			subdivision_code: undefined,
			vat_id: undefined,
			organization: undefined,
		} );
	} );
	it( 'adds the new location postalCode if set', function () {
		const result = addLocationToResponseCart( cart, { postalCode: '90210' } );
		expect( result.tax.location ).toEqual( {
			country_code: undefined,
			postal_code: '90210',
			subdivision_code: undefined,
			vat_id: undefined,
			organization: undefined,
		} );
	} );
	it( 'adds the new location subdivisionCode if set', function () {
		const result = addLocationToResponseCart( cart, { subdivisionCode: 'CA' } );
		expect( result.tax.location ).toEqual( {
			country_code: undefined,
			postal_code: undefined,
			subdivision_code: 'CA',
			vat_id: undefined,
			organization: undefined,
		} );
	} );
	it( 'adds the new location vatId if set', function () {
		const result = addLocationToResponseCart( cart, { vatId: '123456' } );
		expect( result.tax.location ).toEqual( {
			country_code: undefined,
			postal_code: undefined,
			vat_id: '123456',
			organization: undefined,
		} );
	} );
	it( 'adds the new location organization if set', function () {
		const result = addLocationToResponseCart( cart, { organization: 'Test Co.' } );
		expect( result.tax.location ).toEqual( {
			country_code: undefined,
			postal_code: undefined,
			vat_id: undefined,
			organization: 'Test Co.',
		} );
	} );
	it( 'adds all new location codes if set', function () {
		const result = addLocationToResponseCart( cart, {
			subdivisionCode: 'CA',
			postalCode: '90210',
			countryCode: 'US',
			vatId: '12345',
			organization: 'Test Co.',
		} );
		expect( result.tax.location ).toEqual( {
			country_code: 'US',
			postal_code: '90210',
			subdivision_code: 'CA',
			vat_id: '12345',
			organization: 'Test Co.',
		} );
	} );
	it( 'resets all codes when no codes are set', function () {
		const result = addLocationToResponseCart(
			{
				...cart,
				tax: {
					...cart.tax,
					location: {
						...cart.tax.location,
						postal_code: '90210',
						country_code: 'US',
						vat_id: '12345',
					},
				},
			},
			{}
		);
		expect( result.tax.location ).toEqual( {
			country_code: undefined,
			postal_code: undefined,
			subdivision_code: undefined,
			vat_id: undefined,
			organization: undefined,
		} );
	} );
} );

describe( 'doesCartLocationDifferFromResponseCartLocation', function () {
	const cartWithLocation = {
		...cart,
		tax: {
			...cart.tax,
			location: {
				...cart.tax.location,
				country_code: 'US',
				subdivision_code: 'CA',
				postal_code: '90210',
				vat_id: '12345',
				organization: 'Test Co.',
			},
		},
	};

	it( 'returns true if new values are empty strings that differ', function () {
		const result = doesCartLocationDifferFromResponseCartLocation( cartWithLocation, {
			countryCode: '',
			subdivisionCode: '',
			postalCode: '',
			vatId: '',
			organization: '',
		} );
		expect( result ).toBe( true );
	} );
	it( 'returns true if countryCode differs', function () {
		const result = doesCartLocationDifferFromResponseCartLocation( cartWithLocation, {
			countryCode: 'CA',
			subdivisionCode: 'CA',
			postalCode: '90210',
			vatId: '12345',
			organization: 'Test Co.',
		} );
		expect( result ).toBe( true );
	} );
	it( 'returns true if postalCode differs', function () {
		const result = doesCartLocationDifferFromResponseCartLocation( cartWithLocation, {
			countryCode: 'US',
			subdivisionCode: 'CA',
			postalCode: '10001',
			vatId: '12345',
			organization: 'Test Co.',
		} );
		expect( result ).toBe( true );
	} );
	it( 'returns true if subdivisionCode differs', function () {
		const result = doesCartLocationDifferFromResponseCartLocation( cartWithLocation, {
			countryCode: 'US',
			subdivisionCode: 'MA',
			postalCode: '90210',
			vatId: '12345',
			organization: 'Test Co.',
		} );
		expect( result ).toBe( true );
	} );
	it( 'returns true if vatId differs', function () {
		const result = doesCartLocationDifferFromResponseCartLocation( cartWithLocation, {
			countryCode: 'US',
			subdivisionCode: 'MA',
			postalCode: '90210',
			vatId: '545454',
			organization: 'Test Co.',
		} );
		expect( result ).toBe( true );
	} );
	it( 'returns true if organization differs', function () {
		const result = doesCartLocationDifferFromResponseCartLocation( cartWithLocation, {
			countryCode: 'US',
			subdivisionCode: 'MA',
			postalCode: '90210',
			vatId: '12345',
			organization: 'Testers, Inc.',
		} );
		expect( result ).toBe( true );
	} );
	it( 'returns false if all are the same', function () {
		const result = doesCartLocationDifferFromResponseCartLocation( cartWithLocation, {
			countryCode: 'US',
			subdivisionCode: 'CA',
			postalCode: '90210',
			vatId: '12345',
			organization: 'Test Co.',
		} );
		expect( result ).toBe( false );
	} );
	it( 'returns false if all are the same and subdivisionCode is empty', function () {
		const result = doesCartLocationDifferFromResponseCartLocation(
			{
				...cartWithLocation,
				tax: {
					...cartWithLocation.tax,
					location: {
						country_code: 'US',
						subdivision_code: '',
						postal_code: '90210',
						vat_id: '12345',
						organization: 'Test Co.',
					},
				},
			},
			{
				countryCode: 'US',
				subdivisionCode: '',
				postalCode: '90210',
				vatId: '12345',
				organization: 'Test Co.',
			}
		);
		expect( result ).toBe( false );
	} );
	it( 'returns false if all are the same, subdivisionCode is empty, and remote subdivisionCode is missing', function () {
		const result = doesCartLocationDifferFromResponseCartLocation(
			{
				...cartWithLocation,
				tax: {
					...cartWithLocation.tax,
					location: {
						country_code: 'US',
						postal_code: '90210',
						vat_id: '12345',
						organization: 'Test Co.',
					},
				},
			},
			{
				countryCode: 'US',
				subdivisionCode: '',
				postalCode: '90210',
				vatId: '12345',
				organization: 'Test Co.',
			}
		);
		expect( result ).toBe( false );
	} );
	it( 'returns false if all are the same, subdivisionCode is missing, and remote subdivisionCode is not missing', function () {
		const result = doesCartLocationDifferFromResponseCartLocation( cartWithLocation, {
			countryCode: 'US',
			postalCode: '90210',
			vatId: '12345',
			organization: 'Test Co.',
		} );
		expect( result ).toBe( false );
	} );
	it( 'returns false if no new location codes are provided and a remote location exists', function () {
		const result = doesCartLocationDifferFromResponseCartLocation( cartWithLocation, {
			countryCode: undefined,
			subdivisionCode: undefined,
			postalCode: undefined,
			vatId: '12345',
			organization: 'Test Co.',
		} );
		expect( result ).toBe( false );
	} );
} );

describe( 'removeCouponFromResponseCart', function () {
	it( 'removes an applied coupon', function () {
		const result = removeCouponFromResponseCart( {
			...cart,
			coupon: 'ABVD',
			is_coupon_applied: true,
		} );
		expect( result ).toEqual( cart );
	} );
	it( 'has no effect on an unapplied coupon', function () {
		const result = removeCouponFromResponseCart( cart );
		expect( result ).toEqual( cart );
	} );
} );

describe( 'removeItemFromResponseCart', function () {
	describe( 'cart with two items and item present', function () {
		const responseCart = {
			...cart,
			products: [
				{
					product_name: 'WordPress.com Personal',
					product_slug: 'wpcom_personal',
					product_id: 0,
					currency: 'USD',
					item_subtotal_integer: 0,
					item_subtotal_display: '$0',
					is_domain_registration: false,
					meta: '',
					volume: 1,
					extra: [],
					uuid: '0',
				},
				{
					product_name: 'DotLive Domain',
					product_slug: 'dotlive_domain',
					product_id: 0,
					currency: 'USD',
					item_subtotal_integer: 0,
					item_subtotal_display: '$0',
					is_domain_registration: true,
					meta: '',
					volume: 1,
					extra: [],
					uuid: '1',
				},
			],
		};

		const result = removeItemFromResponseCart( responseCart, '0' );

		it( 'has expected array of uuids', function () {
			expect( result.products.map( ( product ) => product.uuid ) ).toEqual( [ '1' ] );
		} );
	} );

	describe( 'cart with two items and item not present', function () {
		const responseCart = {
			...cart,
			products: [
				{
					product_name: 'WordPress.com Personal',
					product_slug: 'wpcom_personal',
					product_id: 0,
					currency: 'USD',
					item_subtotal_integer: 0,
					item_subtotal_display: '$0',
					is_domain_registration: false,
					meta: '',
					volume: 1,
					extra: [],
					uuid: '0',
				},
				{
					product_name: 'DotLive Domain',
					product_slug: 'dotlive_domain',
					product_id: 0,
					currency: 'USD',
					item_subtotal_integer: 0,
					item_subtotal_display: '$0',
					is_domain_registration: true,
					meta: '',
					volume: 1,
					extra: [],
					uuid: '1',
				},
			],
		};

		const result = removeItemFromResponseCart( responseCart, '2' );

		it( 'has expected array of uuids', function () {
			expect( result.products.map( ( product ) => product.uuid ) ).toEqual( [ '0', '1' ] );
		} );
	} );
} );

describe( 'addCouponToResponseCart', function () {
	const result = addCouponToResponseCart( cart, 'fakecoupon' );

	it( 'has the expected coupon', function () {
		expect( result.coupon ).toEqual( 'fakecoupon' );
	} );
	it( 'does not have the coupon applied', function () {
		expect( result.is_coupon_applied ).toEqual( false );
	} );
} );

describe( 'convertResponseCartToRequestCart', function () {
	it( 'preserves the tax location', function () {
		const responseCart = {
			...cart,
			products: [
				{
					product_name: 'WordPress.com Personal',
					product_slug: 'wpcom_personal',
					product_id: 0,
					currency: 'USD',
					item_subtotal_integer: 0,
					item_subtotal_display: '$0',
					is_domain_registration: false,
					meta: '',
					volume: 1,
					extra: [],
					uuid: '0',
				},
				{
					product_name: 'DotLive Domain',
					product_slug: 'dotlive_domain',
					product_id: 0,
					currency: 'USD',
					item_subtotal_integer: 0,
					item_subtotal_display: '$0',
					is_domain_registration: true,
					meta: '',
					volume: 1,
					extra: [],
					uuid: '1',
				},
			],
			tax: {
				display_taxes: true,
				location: {
					country_code: 'US',
					postal_code: 90210,
				},
			},
		};

		const requestCart = convertResponseCartToRequestCart( responseCart );

		expect( requestCart.tax.location.country_code ).toEqual(
			responseCart.tax.location.country_code
		);
		expect( requestCart.tax.location.postal_code ).toEqual( responseCart.tax.location.postal_code );
	} );
} );

describe( 'convertRawResponseCartToResponseCart', function () {
	const responseCart = {
		...cart,
		products: [
			{
				product_name: 'WordPress.com Personal',
				product_slug: 'wpcom_personal',
				product_id: 0,
				currency: 'USD',
				item_subtotal_integer: 0,
				item_subtotal_display: '$0',
				is_domain_registration: false,
				meta: '',
				volume: 1,
				extra: [],
				uuid: '0',
			},
			{
				product_name: 'DotLive Domain',
				product_slug: 'dotlive_domain',
				product_id: 0,
				currency: 'USD',
				item_subtotal_integer: 0,
				item_subtotal_display: '$0',
				is_domain_registration: true,
				meta: '',
				volume: 1,
				extra: [],
				uuid: '1',
			},
		],
		tax: {
			display_taxes: true,
			location: {
				country_code: 'US',
				postal_code: 90210,
			},
		},
	};

	it( 'preserves the tax location if set', function () {
		const result = convertRawResponseCartToResponseCart( responseCart );
		expect( result.tax.location.country_code ).toEqual( responseCart.tax.location.country_code );
		expect( result.tax.location.postal_code ).toEqual( responseCart.tax.location.postal_code );
		expect( result.tax.display_taxes ).toEqual( responseCart.tax.display_taxes );
	} );

	it( 'converts the tax location if the tax location is an array', function () {
		const result = convertRawResponseCartToResponseCart( {
			...responseCart,
			tax: { location: [] },
		} );
		expect( Array.isArray( result.tax.location ) ).toBeFalsy();
		expect( typeof result.tax.location === 'object' ).toBeTruthy();
	} );
} );
