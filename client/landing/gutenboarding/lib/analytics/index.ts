import { recordTracksEvent } from '@automattic/calypso-analytics';
import { FLOW_ID } from '../../constants';
import type { StepNameType } from '../../path';
import type { ErrorParameters, OnboardingCompleteParameters, TracksEventProperties } from './types';

export * from './recaptcha';

/**
 * Make tracks call with embedded flow.
 *
 * @param {string} eventId The name/id of the tracks event. Must be in snake_case and prefixed with "calypso" e.g. `calypso_something_snake_case`
 * @param {Object} params A set of params to pass to analytics
 * @param {string} flow (Optional) The id of the flow, e.g., 'gutenboarding'
 */
export function trackEventWithFlow( eventId: string, params = {}, flow = FLOW_ID ): void {
	recordTracksEvent( eventId, {
		flow,
		...params,
	} );
}

/**
 * Analytics call at the start of the Gutenboarding flow
 *
 * @param {string} ref  The value of a `ref` query parameter, usually set by marketing landing pages
 * @param {number} site_count The number of sites owned by the current user or 0 if there is no logged in user
 * @param {string} flow the current onboarding flow
 */
export function recordOnboardingStart( ref = '', site_count: number, flow: string ): void {
	if ( ! ref ) {
		ref = new URLSearchParams( window.location.search ).get( 'ref' ) || ref;
	}
	const eventProps = { ref, site_count };
	trackEventWithFlow( 'calypso_newsite_start', eventProps, flow );
	// Also fire the signup start|complete events. See: pbmFJ6-95-p2
	trackEventWithFlow( 'calypso_signup_start', eventProps, flow );
}

/**
 * Analytics call at the completion  of a Gutenboarding flow
 *
 * @param {Object} params A set of params to pass to analytics for signup completion
 */
export function recordOnboardingComplete( params: OnboardingCompleteParameters ): void {
	const trackingParams = {
		is_new_user: params.isNewUser,
		is_new_site: params.isNewSite,
		is_blank_canvas: params.isBlankCanvas,
		blog_id: params.blogId,
		has_cart_items: params.hasCartItems,
		flow: params.flow,
	};
	trackEventWithFlow( 'calypso_newsite_complete', trackingParams );
	// Also fire the signup start|complete events. See: pbmFJ6-95-p2
	trackEventWithFlow( 'calypso_signup_complete', trackingParams );
}

/**
 * A generic event for onboarding errors
 *
 * @param {Object} params A set of params to pass to analytics for signup errors
 */
export function recordOnboardingError( params: ErrorParameters ): void {
	trackEventWithFlow( 'calypso_newsite_error', {
		error: params.error,
		step: params.step,
	} );
}

/**
 * Records the closing of a modal in tracks
 *
 * @param modalName The name of the modal to record in tracks
 * @param eventProperties Additional properties to record on closing the modal
 */
export function recordCloseModal( modalName: string, eventProperties?: TracksEventProperties ) {
	trackEventWithFlow( 'calypso_newsite_modal_close', {
		name: modalName,
		...eventProperties,
	} );
}

/**
 * Records the closing of a modal in tracks
 *
 * @param modalName The name of the modal to record in tracks
 */
export function recordEnterModal( modalName: string ) {
	trackEventWithFlow( 'calypso_newsite_modal_open', {
		name: modalName,
	} );
}

/**
 * Records leaving a signup step in tracks
 *
 * @param stepName The name of the step to record in tracks
 * @param eventProperties Additional properties to record on leaving the step
 */
export function recordLeaveStep( stepName: StepNameType, eventProperties?: TracksEventProperties ) {
	trackEventWithFlow( 'calypso_newsite_step_leave', {
		step: stepName,
		...eventProperties,
	} );
}

/**
 * Records entering a step in tracks
 *
 * @param stepName The name of the step to record in tracks
 */
export function recordEnterStep( stepName: StepNameType ) {
	trackEventWithFlow( 'calypso_newsite_step_enter', {
		step: stepName,
	} );
}

/**
 * Records entering a site title in tracks
 *
 * @param hasValue The site title entered by the user is not empty
 */
export function recordSiteTitleSelection( hasValue: boolean ) {
	trackEventWithFlow( 'calypso_newsite_site_title_selected', {
		has_selected_site_title: hasValue,
	} );
}

/**
 * Records site title input skip on Intent Gathering step
 */
export function recordSiteTitleSkip() {
	trackEventWithFlow( 'calypso_newsite_site_title_skipped' );
}
