/* Refernces
- https://github.com/ckeditor/ckeditor5/blob/master/packages/ckeditor5-upload/src/adapters/simpleuploadadapter.js
- https://ckeditor.com/docs/ckeditor5/latest/framework/guides/deep-dive/upload-adapter.html
*/

/* globals XMLHttpRequest, FormData, console */

/**
 * Upload adapter.
 *
 * @private
 * @implements module:upload/filerepository~UploadAdapter
 */
class CustomImageUploadAdapter {
	/**
	 * Creates a new adapter instance.
	 *
	 * @param {module:upload/filerepository~FileLoader} loader
	 * @param {path: ./adapters/customimageuploadadapter~CustomImageUploadConfig} options
	 */
	constructor( loader, options ) {
		/**
		 * FileLoader instance to use during the upload.
		 *
		 * @member {path: ./filerepository~FileLoader} #loader
		 */
		this.loader = loader;

		/**
		 * The configuration of the adapter.
		 *
		 * @member {path: ./adapters/customimageuploadadapter~CustomImageUploadConfig} #options
		 */
		this.options = options;
	}

	/**
	 * Starts the upload process.
	 *
	 * @see module:upload/filerepository~UploadAdapter#upload
	 * @returns {Promise}
	 */
	upload() {
		return this.loader.file.then(
			file =>
				new Promise( ( resolve, reject ) => {
					this._initRequest();
					this._initListeners( resolve, reject, file );
					this._sendRequest( file );
				} )
		);
	}

	/**
	 * Aborts the upload process.
	 *
	 * @see module:upload/filerepository~UploadAdapter#abort
	 * @returns {Promise}
	 */
	abort() {
		if ( this.xhr ) {
			this.xhr.abort();
		}
	}

	/**
	 * Initializes the `XMLHttpRequest` object using the URL specified as
	 * {@link module:upload/adapters/customimageuploadadapter~CustomImageUploadConfig#baseApiUrl `customImageUpload.baseApiUrl`}
	 * {@link module:upload/adapters/customimageuploadadapter~CustomImageUploadConfig#api `customImageUpload.api`}
	 * in the editor's configuration.
	 *
	 * @private
	 */
	_initRequest() {
		const xhr = ( this.xhr = new XMLHttpRequest() );

		// Note that your request may look different. It is up to you and your editor
		// integration to choose the right communication channel. This example uses
		// a POST request with JSON as a data structure but your configuration
		// could be different.

		xhr.open( 'POST', `${ this.options.baseApiUrl }/${ this.options.api }`, true );
		xhr.responseType = 'json';
	}

	/**
	 * Initializes XMLHttpRequest listeners
	 *
	 * @private
	 * @param {Function} resolve Callback function to be called when the request is successful.
	 * @param {Function} reject Callback function to be called when the request cannot be completed.
	 * @param {File} file Native File object.
	 */
	_initListeners( resolve, reject, file ) {
		const xhr = this.xhr;
		const loader = this.loader;
		const genericErrorText = `Couldn't upload file: ${ file.name }.`;

		xhr.addEventListener( 'error', () => reject( genericErrorText ) );
		xhr.addEventListener( 'abort', () => reject() );
		xhr.addEventListener( 'load', () => {
			const response = xhr.response;

			// This example assumes the XHR server's "response" object will come with
			// an "error" which has its own "message" that can be passed to reject()
			// in the upload promise.
			//
			// Your integration may handle upload errors in a different way so make sure
			// it is done properly. The reject() function must be called when the upload fails.
			if ( !response || response.error ) {
				return reject(
					response && response.error ?
						response.error.message :
						genericErrorText
				);
			}

			// If the upload is successful, resolve the upload promise with an object containing
			// at least the "default" URL, pointing to the image on the server.
			// This URL will be used to display the image in the content. Learn more in the
			// UploadAdapter#upload documentation.
			resolve( {
				default: `${ this.options.baseApiUrl }/${ this.options.api }/${ response.imageId }`
			} );
		} );

		// Upload progress when it is supported. The file loader has the #uploadTotal and #uploaded
		// properties which are used e.g. to display the upload progress bar in the editor
		// user interface.
		if ( xhr.upload ) {
			xhr.upload.addEventListener( 'progress', evt => {
				if ( evt.lengthComputable ) {
					loader.uploadTotal = evt.total;
					loader.uploaded = evt.loaded;
				}
			} );
		}
	}

	/**
	 * Prepares the data and sends the request.
	 *
	 * @private
	 * @param {File} file File instance to be uploaded.
	 */
	_sendRequest( file ) {
		// Set headers
		this.xhr.setRequestHeader(
			'authorization',
			`bearer ${ this.options.authOpenIdService.getAuthToken() }`
		);

		// Prepare the form data.
		const data = new FormData();
		data.append( 'name', file.name );
		data.append( 'description', file.name );
		data.append( 'file', file );
		// Important note: This is the right place to implement security mechanisms
		// like authentication and CSRF protection. For instance, you can use
		// XMLHttpRequest.setRequestHeader() to set the request headers containing
		// the CSRF token generated earlier by your application.

		// Send the request.
		this.xhr.send( data );
	}
}

export default function CustomImageUploadAdapterPlugin( editor ) {
	const options = editor.config.get( 'customImageUpload' );

	if ( !options ) {
		/**
		 * The {@link path:./adapters/customimageupload~CustomImageUploadConfig `config.customImageUpload`}
		 * configuration required by the {@link path:./adapters/customimageupload~CustomImageUploadAdapter `CustomImageUploadAdapter`}
		 * is missing. Make sure the correct URL is specified for the image upload to work properly.
		 *
		 * @error custom-image-upload-adapter-missing-customImageUploadConfig
		 */
		console.error( 'custom-image-upload-adapter-missing-customImageUploadConfig' );
		return;
	}

	if ( !options.baseApiUrl ) {
		/**
		 * The {@link path:./adapters/customimageupload~CustomImageUploadConfig#baseApiUrl `config.customImageUpload.baseApiUrl`}
		 * configuration required by the {@link path:./adapters/customimageupload~CustomImageUploadAdapter `CustomImageUploadAdapter`}
		 * is missing. Make sure the correct URL is specified for the image upload to work properly.
		 *
		 * @error custom-image-upload-adapter-missing-baseApiUrl
		 */
		console.error( 'custom-image-upload-adapter-missing-baseApiUrl' );

		return;
	}

	if ( !options.api ) {
		/**
		 * The {@link path:./adapters/customimageupload~CustomImageUploadConfig#api `config.customImageUpload.api`}
		 * configuration required by the {@link path:./adapters/customimageupload~CustomImageUploadAdapter `CustomImageUploadAdapter`}
		 * is missing. Make sure the correct URL is specified for the image upload to work properly.
		 *
		 * @error custom-image-upload-adapter-missing-api
		 */
		console.error( 'custom-image-upload-adapter-missing-api' );

		return;
	}

	if ( options.baseApiUrl && options.api && !options.authOpenIdService ) {
		/**
		 * The
		 * {@link path:./adapters/customimageupload~CustomImageUploadConfig#authOpenIdService `config.customImageUpload.authOpenIdService`}
		 * configuration required by the {@link path:./adapters/customimageupload~CustomImageUploadAdapter `CustomImageUploadAdapter`}
		 * is missing. Make sure the correct URL is specified for the image upload to work properly.
		 *
		 * @error custom-image-upload-adapter-missing-authOpenIdService
		 */
		console.error( 'custom-image-upload-adapter-missing-authOpenIdService' );

		return;
	}

	editor.plugins.get( 'FileRepository' ).createUploadAdapter = loader => {
		// Configure the URL to the upload script in your back-end here!
		return new CustomImageUploadAdapter(
			loader,
			editor.config.get( 'customImageUpload' )
		);
	};
}
