import classNames from 'classnames';
import { translate } from 'i18n-calypso';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import SiteIcon from 'calypso/blocks/site-icon';
import QueryReaderSite from 'calypso/components/data/query-reader-site';
import ReaderFollowFeedIcon from 'calypso/reader/components/icons/follow-feed-icon';
import ReaderFollowingFeedIcon from 'calypso/reader/components/icons/following-feed-icon';
import { getSiteUrl, getSourceFollowUrl, getSourceData } from 'calypso/reader/discover/helper';
import FollowButton from 'calypso/reader/follow-button';
import { getSite } from 'calypso/state/reader/sites/selectors';
import { getLinkProps } from './helper';
import { recordFollowToggle, recordSiteClick } from './stats';
import './site-attribution.scss';

class DiscoverSiteAttribution extends Component {
	static propTypes = {
		post: PropTypes.object.isRequired,
	};

	onSiteClick = () => recordSiteClick( this.props.siteUrl );

	onFollowToggle = ( isFollowing ) => recordFollowToggle( isFollowing, this.props.siteUrl );

	render() {
		const { post, site } = this.props;
		const attribution = get( post, 'discover_metadata.attribution' );
		const siteUrl = getSiteUrl( post );
		const followUrl = getSourceFollowUrl( post );
		const { blogId: siteId } = getSourceData( post );
		const siteLinkProps = getLinkProps( siteUrl );
		const siteClasses = classNames( 'discover-attribution__blog ignore-click' );

		let avatarUrl = attribution.avatar_url;
		// Drop default avatar
		if ( avatarUrl.endsWith( 'defaultavatar.png' ) ) {
			avatarUrl = null;
		}

		/* eslint-disable wpcalypso/jsx-classname-namespace */
		return (
			<div className="discover-attribution is-site">
				{ avatarUrl && (
					<img
						className="gravatar"
						src={ encodeURI( attribution.avatar_url ) }
						alt="Avatar"
						width="20"
						height="20"
					/>
				) }
				{ ! avatarUrl && siteId && ! site && <QueryReaderSite siteId={ siteId } /> }
				{ ! avatarUrl && <SiteIcon site={ site } size={ 20 } /> }
				<span className="discover-attribution__site-title">
					<a
						{ ...siteLinkProps }
						className={ siteClasses }
						href={ encodeURI( siteUrl ) }
						onClick={ this.onSiteClick }
					>
						{ translate( 'visit' ) } <em>{ attribution.blog_name }</em>
					</a>
				</span>
				{ followUrl && (
					<FollowButton
						siteUrl={ followUrl }
						iconSize={ 20 }
						onFollowToggle={ this.onFollowToggle }
						followIcon={ ReaderFollowFeedIcon( { iconSize: 20 } ) }
						followingIcon={ ReaderFollowingFeedIcon( { iconSize: 20 } ) }
					/>
				) }
			</div>
		);
		/* eslint-enable wpcalypso/jsx-classname-namespace */
	}
}

export default connect( ( state, ownProps ) => {
	const { blogId: siteId } = getSourceData( ownProps.post );
	return {
		site: getSite( state, siteId ),
	};
} )( DiscoverSiteAttribution );
