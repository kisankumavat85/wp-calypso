import { BlockRendererProvider, PatternsRendererProvider } from '@automattic/block-renderer';
import type { SiteInfo } from '@automattic/block-renderer';

interface Props {
	siteId: number | string;
	stylesheet: string;
	patternIds: string[];
	children: JSX.Element;
	siteInfo: SiteInfo;
}

const PatternAssemblerContainer = ( {
	siteId,
	stylesheet,
	patternIds,
	children,
	siteInfo,
}: Props ) => (
	<BlockRendererProvider siteId={ siteId } stylesheet={ stylesheet }>
		<PatternsRendererProvider
			// Use theme demo site to render the site-related blocks for now.
			// For example, site logo, site title, site tagline, posts.
			siteId={ siteId }
			stylesheet={ stylesheet }
			patternIds={ patternIds }
			siteInfo={ siteInfo }
		>
			{ children }
		</PatternsRendererProvider>
	</BlockRendererProvider>
);

export default PatternAssemblerContainer;
