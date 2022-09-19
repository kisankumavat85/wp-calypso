import { SiteDetails } from '@automattic/data-stores';
import { FormFileUpload } from '@wordpress/components';
import { Icon, upload } from '@wordpress/icons';
import { useI18n } from '@wordpress/react-i18n';
import classNames from 'classnames';
import React, { useCallback, useEffect } from 'react';
import ImageEditor from 'calypso/blocks/image-editor';
import DropZone from 'calypso/components/drop-zone';
import FormFieldset from 'calypso/components/forms/form-fieldset';
import './style.scss';

export type SiteIconWithPickerProps = {
	selectedFile: File | undefined;
	onSelect: ( file: File ) => void;
	site: SiteDetails | null;
	imageEditorClassName?: string;
	uploadFieldClassName?: string;
	disabled?: boolean;
	placeholderText?: string;
};
export function SiteIconWithPicker( {
	selectedFile,
	onSelect,
	site,
	imageEditorClassName,
	uploadFieldClassName,
	disabled,
	placeholderText,
}: SiteIconWithPickerProps ) {
	const { __ } = useI18n();

	const [ selectedFileUrl, setSelectedFileUrl ] = React.useState< string | undefined >();
	const [ editingFileName, setEditingFileName ] = React.useState< string >();
	const [ editingFile, setEditingFile ] = React.useState< string >();
	const [ imageEditorOpen, setImageEditorOpen ] = React.useState< boolean >( false );
	const siteIconUrl = site?.icon?.img;

	const handleFileChange = useCallback(
		( file: File | undefined ) => {
			if ( file ) {
				setEditingFileName( file.name );
				setEditingFile( URL.createObjectURL( file ) );
				setImageEditorOpen( true );
			}
		},
		[ setEditingFileName, setEditingFile, setImageEditorOpen ]
	);

	useEffect( () => {
		if ( selectedFile ) {
			setSelectedFileUrl( URL.createObjectURL( selectedFile ) );
		}
	}, [ selectedFile ] );

	return (
		<>
			{ editingFile && imageEditorOpen && (
				<ImageEditor
					className={ classNames( 'site-icon-with-picker__image-editor', imageEditorClassName ) }
					siteId={ site?.ID }
					media={ {
						src: editingFile,
					} }
					allowedAspectRatios={ [ 'ASPECT_1X1' ] }
					onDone={ ( _error: Error | null, image: Blob ) => {
						onSelect( new File( [ image ], editingFileName || 'site-logo.png' ) );
						setSelectedFileUrl( URL.createObjectURL( image ) );
						setImageEditorOpen( false );
					} }
					onCancel={ () => {
						setEditingFile( undefined );
						setEditingFileName( undefined );
						setImageEditorOpen( false );
					} }
					widthLimit={ 512 }
				/>
			) }
			<FormFieldset
				className={ classNames( 'site-icon-with-picker__site-icon', uploadFieldClassName ) }
				disabled={ disabled }
			>
				<DropZone
					className="site-icon-with-picker__dropzone"
					textLabel={ ' ' }
					icon={ <Icon icon={ upload } /> }
					onFilesDrop={ ( files: FileList ) => {
						handleFileChange( files[ 0 ] );
					} }
				/>
				<FormFileUpload
					className={ classNames( 'site-icon-with-picker__upload-button', {
						'has-icon-or-image': selectedFile || siteIconUrl,
					} ) }
					accept=".jpg,.jpeg,.gif,.png"
					onChange={ ( event ) => {
						handleFileChange( event.target.files?.[ 0 ] );
						// onChange won't fire if the user picks the same file again
						// delete the value so users can reselect the same file again
						event.target.value = '';
					} }
				>
					{ selectedFileUrl || siteIconUrl ? (
						<img src={ selectedFileUrl || siteIconUrl } alt={ site?.name } />
					) : (
						<Icon icon={ upload } />
					) }
					<span>
						{ selectedFileUrl || siteIconUrl
							? __( 'Replace' )
							: placeholderText || __( 'Add a site icon' ) }
					</span>
				</FormFileUpload>
			</FormFieldset>
		</>
	);
}
