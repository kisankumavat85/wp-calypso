import { Page, Locator } from 'playwright';
import envVariables from '../../env-variables';
import { translateFromPage } from '../utils';
import type { EditorPreviewOptions } from './types';

const postEditorHeader = 'div.interface-interface-skeleton__header';
const siteEditorHeader = 'div.edit-site-layout__header';
const settingsButtonLabel = 'Settings';
const moreOptionsLabel = 'Options';
const selectors = {
	// Block Inserter
	// Note the partial class match. This is to support site and post editor. We can't use aria-label because of i18n. :(
	blockInserterButton: ( header: string ) => `${ header } button[class*="inserter-toggle"]`,

	// Draft
	saveDraftButton: ( header: string ) =>
		`${ header } button[aria-label="Save draft"], button[aria-label="Saved"]`,
	switchToDraftButton: ( header: string ) => `${ header } button.editor-post-switch-to-draft`,

	// Preview
	previewButton: ( header: string ) => `${ header } :text("View"):visible`,
	desktopPreviewMenuItem: ( target: EditorPreviewOptions ) =>
		`button[role="menuitem"] span:text("${ target }")`,
	previewPane: ( target: EditorPreviewOptions ) => `.is-${ target.toLowerCase() }-preview`,

	// Publish
	publishButton: ( header: string, state: 'disabled' | 'enabled' ) => {
		const buttonState = state === 'disabled' ? 'true' : 'false';
		return `${ header } button.editor-post-publish-button__button[aria-disabled="${ buttonState }"]`;
	},

	// List view
	listViewButton: ( header: string ) => `${ header } button[aria-label="List View"]`,

	// Details popover
	detailsButton: ( header: string ) => `${ header } button[aria-label="Details"]`,

	// Document Actions dropdown
	documentActionsDropdown: ( header: string ) =>
		`${ header } button[aria-label="Show template details"]`,
	documentActionsDropdownItem: ( itemSelector: string ) => `.popover-slot ${ itemSelector }`,
	documentActionsDropdownShowAll: `.popover-slot .edit-site-template-details__show-all-button`,

	// Editor settings
	settingsButton: ( header: string, label = settingsButtonLabel ) =>
		`${ header } .edit-post-header__settings .interface-pinned-items button[aria-label="${ label }"]`,

	// Undo/Redo
	undoButton: 'button[aria-disabled=false][aria-label="Undo"]',
	redoButton: 'button[aria-disabled=false][aria-label="Redo"]',

	// More options
	moreOptionsButton: ( header: string, label = moreOptionsLabel ) =>
		`${ header } button[aria-label="${ label }"]`,

	// Site editor save
	saveSiteEditorButton: ( header: string ) => `${ header } button.edit-site-save-button__button`,

	// Nav sidebar
	navSidebarButton:
		'button[aria-label="Block editor sidebar"],button[aria-label="Toggle navigation"]',
};

/**
 * Represents an instance of the WordPress.com Editor's persistent toolbar.
 */
export class EditorToolbarComponent {
	private page: Page;
	private editor: Locator;
	private header: string;

	/**
	 * Constructs an instance of the component.
	 *
	 * @param {Page} page The underlying page.
	 * @param {Locator} editor Locator or FrameLocator to the editor.
	 * @param {string} context Context of the editor (e.g. whether it's editing a post or the site).
	 */
	constructor(
		page: Page,
		editor: Locator,
		context: 'post-editor' | 'site-editor' = 'post-editor'
	) {
		this.page = page;
		this.editor = editor;
		this.header = context === 'post-editor' ? postEditorHeader : siteEditorHeader;
	}

	/**
	 * Translate string.
	 */
	private async translateFromPage( string: string ): Promise< string > {
		return translateFromPage( this.editor, string );
	}

	/* General helper */

	/**
	 * Given a selector, determines whether the target button/toggle is
	 * in an expanded state.
	 *
	 * If the toggle is in the on state or otherwise in an expanded
	 * state, this method will return true. Otherwise, false.
	 *
	 * @param {string} selector Target selector.
	 * @returns {Promise<boolean>} True if target is in an expanded state. False otherwise.
	 */
	private async targetIsOpen( selector: string ): Promise< boolean > {
		const locator = this.editor.locator( selector );
		const pressed = await locator.getAttribute( 'aria-pressed' );
		const expanded = await locator.getAttribute( 'aria-expanded' );
		return pressed === 'true' || expanded === 'true';
	}

	/* Block Inserter */

	/**
	 * Opens the block inserter.
	 */
	async openBlockInserter(): Promise< void > {
		if ( ! ( await this.targetIsOpen( selectors.blockInserterButton( this.header ) ) ) ) {
			const locator = this.editor.locator( selectors.blockInserterButton( this.header ) );
			await locator.click();
		}
	}

	/**
	 * Closes the block inserter.
	 */
	async closeBlockInserter(): Promise< void > {
		if ( await this.targetIsOpen( selectors.blockInserterButton( this.header ) ) ) {
			// We click on the panel instead of on the block inserter button as a workaround for an issue
			// that disables the block inserter button after inserting a block using the block API V2.
			// See https://github.com/WordPress/gutenberg/issues/43090.
			const locator = this.editor.locator( this.header );
			await locator.click();
		}
	}

	/* Draft */

	/**
	 * Clicks on the 'Save Draft' button on the editor.
	 *
	 * If the button cannot be clicked, the method short-circuits.
	 */
	async saveDraft(): Promise< void > {
		const saveButtonLocator = this.editor.locator( selectors.saveDraftButton( this.header ) );

		try {
			await saveButtonLocator.waitFor( { timeout: 5 * 1000 } );
		} catch {
			return;
		}

		const savedButtonLocator = this.editor.locator(
			`${ selectors.saveDraftButton( this.header ) }.is-saved`
		);

		await saveButtonLocator.click();

		await savedButtonLocator.waitFor();
	}

	/* Preview */

	/**
	 * Launches the Preview when in mobile mode.
	 *
	 * @returns {Page} Handler for the new page object.
	 */
	async openMobilePreview(): Promise< Page > {
		const mobilePreviewButtonLocator = this.editor.locator(
			selectors.previewButton( this.header )
		);

		const [ popup ] = await Promise.all( [
			this.page.waitForEvent( 'popup' ),
			mobilePreviewButtonLocator.click(),
		] );
		return popup;
	}

	/**
	 * Launches the Preview when in Desktop mode, then selects the
	 * target preview option.
	 */
	async openDesktopPreview( target: EditorPreviewOptions ): Promise< void > {
		// Click on the Preview button to open the menu.
		await this.openDesktopPreviewMenu();

		// Locate and click on the intended preview target.
		const desktopPreviewMenuItemLocator = this.editor.locator(
			selectors.desktopPreviewMenuItem( target )
		);
		await desktopPreviewMenuItemLocator.click();

		// Verify the editor panel is resized and stable.
		const desktopPreviewPaneLocator = this.editor.locator( selectors.previewPane( target ) );
		await desktopPreviewPaneLocator.waitFor();
		const elementHandle = await desktopPreviewPaneLocator.elementHandle();
		await elementHandle?.waitForElementState( 'stable' );

		// Click on the Preview button to close the menu.
		await this.closeDesktopPreviewMenu();
	}

	/**
	 * Opens the Preview menu for Desktop viewport.
	 */
	async openDesktopPreviewMenu(): Promise< void > {
		if ( ! ( await this.targetIsOpen( selectors.previewButton( this.header ) ) ) ) {
			const desktopPreviewButtonLocator = this.editor.locator(
				selectors.previewButton( this.header )
			);
			await desktopPreviewButtonLocator.click();
		}
	}

	/**
	 * Closes the Preview menu for the Desktop viewport.
	 */
	async closeDesktopPreviewMenu(): Promise< void > {
		if ( await this.targetIsOpen( selectors.previewButton( this.header ) ) ) {
			const desktopPreviewButtonLocator = this.editor.locator(
				selectors.previewButton( this.header )
			);
			await desktopPreviewButtonLocator.click();
		}
	}

	/* Publish and unpublish */

	/**
	 * Clicks on the primary button to publish the article.
	 *
	 * This is applicable for the following scenarios:
	 * 	- publish of a new article (Publish)
	 * 	- update an existing article (Update)
	 * 	- schedule a post (Schedule)
	 */
	async clickPublish(): Promise< void > {
		const publishButtonLocator = this.editor.locator(
			selectors.publishButton( this.header, 'enabled' )
		);
		await publishButtonLocator.click();
	}

	/**
	 * Clicks on the `Switch to Draft` button and unpublish
	 * the article.
	 */
	async switchToDraft(): Promise< void > {
		const swithcToDraftLocator = this.editor.locator(
			selectors.switchToDraftButton( this.header )
		);
		await swithcToDraftLocator.click();
	}

	/* Editor Settings sidebar */

	/**
	 * Opens the editor settings.
	 */
	async openSettings(): Promise< void > {
		const label = await this.translateFromPage( settingsButtonLabel );
		const selector = selectors.settingsButton( this.header, label );

		if ( await this.targetIsOpen( selector ) ) {
			return;
		}
		const locator = this.editor.locator( selector );
		await locator.click();
	}

	/**
	 * Closes the editor settings.
	 */
	async closeSettings(): Promise< void > {
		const label = await this.translateFromPage( settingsButtonLabel );
		const selector = selectors.settingsButton( this.header, label );

		if ( ! ( await this.targetIsOpen( selector ) ) ) {
			return;
		}
		const locator = this.editor.locator( selector );
		await locator.click();
	}

	/* Navigation sidebar */

	/**
	 * Opens the nav sidebar.
	 */
	async openNavSidebar(): Promise< void > {
		if ( await this.targetIsOpen( selectors.navSidebarButton ) ) {
			return;
		}

		const locator = this.editor.locator( selectors.navSidebarButton );
		await locator.click();
	}

	/**
	 * Closes the nav sidebar.
	 */
	async closeNavSidebar(): Promise< void > {
		if ( ! ( await this.targetIsOpen( selectors.navSidebarButton ) ) ) {
			return;
		}

		const locator = this.editor.locator( selectors.navSidebarButton );
		await locator.click();
	}

	/* List view */

	/**
	 * Opens the list view.
	 */
	async openListView(): Promise< void > {
		if ( envVariables.VIEWPORT_NAME === 'mobile' ) {
			// List view is not available on mobile!
			return;
		}

		if ( await this.targetIsOpen( selectors.listViewButton( this.header ) ) ) {
			return;
		}

		const locator = this.editor.locator( selectors.listViewButton( this.header ) );
		await locator.click();
	}

	/**
	 * Closes the list view.
	 */
	async closeListView(): Promise< void > {
		if ( envVariables.VIEWPORT_NAME === 'mobile' ) {
			// List view is not available on mobile!
			return;
		}

		if ( ! ( await this.targetIsOpen( selectors.listViewButton( this.header ) ) ) ) {
			return;
		}

		const locator = this.editor.locator( selectors.listViewButton( this.header ) );
		await locator.click();
	}

	/* Details popover */

	/**
	 * Opens the post details popover (i.e. number of character, words, etc.).
	 */
	async openDetailsPopover(): Promise< void > {
		if ( envVariables.VIEWPORT_NAME === 'mobile' ) {
			// Details are not available on mobile!
			return;
		}

		if ( await this.targetIsOpen( selectors.detailsButton( this.header ) ) ) {
			return;
		}

		const locator = this.editor.locator( selectors.detailsButton( this.header ) );
		await locator.click();
	}

	/**
	 * Click the editor undo button. Throws an error if the button is not enabled.
	 *
	 * @throws If the undo button is not enabled.
	 */
	async undo(): Promise< void > {
		const locator = this.editor.locator( selectors.undoButton );
		await locator.click();
	}

	/**
	 * Click the editor redo button. Throws an error if the button is not enabled.
	 *
	 * @throws If the redo button is not enabled.
	 */
	async redo(): Promise< void > {
		const locator = this.editor.locator( selectors.redoButton );
		await locator.click();
	}

	/**
	 * Opens the more options menu (three dots).
	 */
	async openMoreOptionsMenu(): Promise< void > {
		const label = await this.translateFromPage( moreOptionsLabel );
		const selector = selectors.moreOptionsButton( this.header, label );

		if ( ! ( await this.targetIsOpen( selector ) ) ) {
			const locator = this.editor.locator( selector );
			await locator.click();
		}
	}

	/** FSE unique buttons */

	/**
	 * Click the save button (publish equivalent) for the full site editor.
	 */
	async saveSiteEditor(): Promise< void > {
		const locator = this.editor.locator( selectors.saveSiteEditorButton( this.header ) );
		await locator.click();
	}

	/**
	 * Click the document actions icon for the full site editor.
	 */
	async clickDocumentActionsIcon(): Promise< void > {
		const locator = this.editor.locator( selectors.documentActionsDropdown( this.header ) );
		await locator.click();
	}

	/**
	 * Click the document actions icon for the full site editor.
	 */
	async clickDocumentActionsDropdownItem( itemName: string ): Promise< void > {
		const locator = this.editor.locator( selectors.documentActionsDropdownItem( itemName ) );
		await locator.click();
	}
}
