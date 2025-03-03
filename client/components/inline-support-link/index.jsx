import { Gridicon } from '@automattic/components';
import { localizeUrl } from '@automattic/i18n-utils';
import { compose } from '@wordpress/compose';
import classnames from 'classnames';
import { localize } from 'i18n-calypso';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import ExternalLink from 'calypso/components/external-link';
import { withRouteModal } from 'calypso/lib/route-modal';
import {
	bumpStat,
	composeAnalytics,
	recordTracksEvent,
	withAnalytics,
} from 'calypso/state/analytics/actions';
import { openSupportArticleDialog } from 'calypso/state/inline-support-article/actions';

import './style.scss';

class InlineSupportLink extends Component {
	state = {
		supportDataFromContext: undefined,
	};

	static propTypes = {
		className: PropTypes.string,
		supportPostId: PropTypes.number,
		supportLink: PropTypes.string,
		showText: PropTypes.bool,
		showIcon: PropTypes.bool,
		supportContext: PropTypes.string,
		iconSize: PropTypes.number,
		tracksEvent: PropTypes.string,
		tracksOptions: PropTypes.object,
		statsGroup: PropTypes.string,
		statsName: PropTypes.string,
		routeModalData: PropTypes.object,
		showSupportModal: PropTypes.bool,
		noWrap: PropTypes.bool,
	};

	static defaultProps = {
		supportPostId: null,
		supportLink: null,
		showText: true,
		showIcon: true,
		iconSize: 14,
		showSupportModal: true,
		noWrap: true,
	};

	componentDidMount() {
		if ( this.props.supportContext && ! this.props.supportPostId && ! this.props.supportLink ) {
			// Lazy load the supportPostId and supportLink by key if not provided.
			import( './context-links' ).then( ( module ) => {
				const contextLinks = module.default;
				const supportDataFromContext = contextLinks[ this.props.supportContext ];
				if ( ! supportDataFromContext ) {
					return;
				}
				this.setState( { supportDataFromContext } );
			} );
		}
	}

	onSupportLinkClick( event, supportPostId, url ) {
		const { showSupportModal, openDialog } = this.props;

		if ( ! showSupportModal ) {
			return;
		}

		const openDialogReturn = openDialog( event, supportPostId, url );
		this.props.routeModalData.openModal( supportPostId );
		return openDialogReturn;
	}

	render() {
		const { className, showText, showIcon, iconSize, translate, children, noWrap } = this.props;

		let { supportPostId, supportLink } = this.props;
		if ( this.state.supportDataFromContext ) {
			supportPostId = this.state.supportDataFromContext.post_id;
			supportLink = this.state.supportDataFromContext.link;
		}

		if ( ! supportPostId && ! supportLink ) {
			return null;
		}

		const LinkComponent = supportPostId ? 'a' : ExternalLink;
		const url = supportPostId ? localizeUrl( supportLink ) : supportLink;
		const externalLinkProps = ! supportPostId && {
			icon: showIcon,
			iconSize,
		};

		const text = children ? children : translate( 'Learn more' );
		let content = (
			<>
				{ showText && text }
				{ supportPostId && showIcon && <Gridicon icon="help-outline" size={ iconSize } /> }
			</>
		);
		/* Prevent widows, sometimes:
			No  Text, No Icon  = Widow not possible
			Yes Text, No Icon  = Widow possible
			No  Text, Yes Icon = Widow not possible
			Yes Text, Yes Icon = Widow possible
		*/
		if ( showText && noWrap ) {
			content = <span className="inline-support-link__nowrap">{ content }</span>;
		}

		return (
			<LinkComponent
				className={ classnames( 'inline-support-link', className ) }
				href={ url }
				onClick={ ( event ) => this.onSupportLinkClick( event, supportPostId, url ) }
				target="_blank"
				rel="noopener noreferrer"
				{ ...externalLinkProps }
			>
				{ content }
			</LinkComponent>
		);
	}
}

const mapDispatchToProps = ( dispatch, ownProps ) => {
	const { tracksEvent, tracksOptions, statsGroup, statsName, supportContext } = ownProps;
	return {
		openDialog: ( event, supportPostId, supportLink ) => {
			if ( ! supportPostId ) {
				return;
			}
			event.preventDefault();
			const analyticsEvents = [
				...[
					recordTracksEvent( 'calypso_inlinesupportlink_click', {
						support_context: supportContext || null,
						support_link: supportLink,
					} ),
				],
				...( tracksEvent ? [ recordTracksEvent( tracksEvent, tracksOptions ) ] : [] ),
				...( statsGroup && statsName ? [ bumpStat( statsGroup, statsName ) ] : [] ),
			];
			if ( analyticsEvents.length > 0 ) {
				return dispatch(
					withAnalytics(
						composeAnalytics( ...analyticsEvents ),
						openSupportArticleDialog( { postId: supportPostId, postUrl: supportLink } )
					)
				);
			}
			return dispatch(
				openSupportArticleDialog( {
					postId: supportPostId,
					postUrl: supportLink,
				} )
			);
		},
	};
};

export default compose(
	connect( null, mapDispatchToProps ),
	localize,
	withRouteModal( 'support-article' )
)( InlineSupportLink );
