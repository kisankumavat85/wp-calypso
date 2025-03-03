import { localize } from 'i18n-calypso';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { RelatedPostCard } from 'calypso/blocks/reader-related-card';
import { SEARCH_RESULTS } from 'calypso/reader/follow-sources';
import HeaderBack from 'calypso/reader/header-back';
import Stream from 'calypso/reader/stream';
import PostPlaceholder from 'calypso/reader/stream/post-placeholder';
import EmptyContent from './empty';

const defaultTransform = ( item ) => item;

class PostResults extends Component {
	static propTypes = {
		query: PropTypes.string,
		streamKey: PropTypes.string,
	};

	placeholderFactory = ( { key, ...rest } ) => {
		if ( ! this.props.query ) {
			return (
				<div className="search-stream__recommendation-list-item" key={ key }>
					<RelatedPostCard { ...rest } />
				</div>
			);
		}
		return <PostPlaceholder key={ key } />;
	};

	render() {
		const { query, translate } = this.props;
		const emptyContent = <EmptyContent query={ query } />;
		const transformStreamItems =
			! query || query === ''
				? ( postKey ) => ( { ...postKey, isRecommendation: true } )
				: defaultTransform;

		return (
			<Stream
				{ ...this.props }
				followSource={ SEARCH_RESULTS }
				listName={ translate( 'Search' ) }
				emptyContent={ emptyContent }
				showFollowInHeader={ true }
				placeholderFactory={ this.placeholderFactory }
				transformStreamItems={ transformStreamItems }
				isMain={ false }
			>
				{ this.props.showBack && <HeaderBack /> }
				<div ref={ this.handleStreamMounted } />
			</Stream>
		);
	}
}

export default localize( PostResults );
