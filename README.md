# Airseed.js

Airseed Javascript API for user authentication and insights API.

This library allows you to trigger the Airseed authentication flow from your webpage, and will provide to you information about the user who successfully authenticates.

## Quick Start

Initialize the airseed JS library with your app's client ID:

    airseed.init('5f14defac0736abe1841d479c480d8f6');

Bind something on the page so that when clicked, the Airseed authentication flow for the specified mail provider will trigger:

    airseed.bind({
      selector: '.login-with-gmail',
      provider: 'google_oauth2',
      flow: 'popup_window'
    });

Provide the success and failure handlers for authentication:

    airseed.success(function(userProfile, authTokens) {
      console.log('success:');
      console.log(userProfile); // 'userProfile' is the response from 'https://api.airseed.com/v1/users/me.json' for the authenticated user
      console.log(authTokens); // 'authTokens' is the response from received at the end of the Airseed OAuth2 flow

      airseed.userAPI(authTokens.access_token, 'suggested-contacts', function(apiResponse) {
        console.log(apiResponse); // /v1/users/.../suggested-contacts.json API response
      });
    });

    airseed.failure(function(err) {
      console.log('failure:');
      console.log(err); // 'err' is an object with a 'message' property
    });

## Bind Parameters

`airseed.bind(...)` can be configured for Gmail, Yahoo, or Outlook mail providers. It can also be configured to trigger the Airseed Authentication Flow as a popup or page redirect.

#### provider

- **google_oauth2**: Gmail/Google+ authentication
- **yahoo**: Yahoo authentication
- **windowslive**: Outlook/Hotmail authentication

#### flow

- **popup_window**: will trigger Airseed Authentication inside of a popup window that closes upon finish
- **page_redirect**: will redirect your page to the start of the Airseed Authentication flow

#### callbackUrl

This option is only applicable of `flow: 'popup_window'` is set.

If this option is set, at the end of the Airseed Authentication flow, the popup will close, and immediately redirect the page to your callback URL. The query string in this redirect will include the user authenticated token parameters.

If this option is left unset, the Airseed JS library will make a `/v1/users/me.json` request on behalf of the successfully authenticated user and pass it to your registered success handler.

#### approvalPrompt

This option, if set (`approvalPrompt: 'force'`), will force display the Airseed Permissions dialog that allows the user to toggle permissions to subsets of their data.

## Airseed API Requests

`airseed.userAPI(accessToken, endpoint, callback, params)` is a method provided to make user API requests using the authentication tokens received from the Airseed OAuth2 flow. Please refer to the [API docs](https://www.airseed.com/api/docs) for endpoints and parameter reference. Example:
  
    airseed.userAPI(
      authTokens.access_token,
      'products',
      function(productsApiResponse) {
        console.log(productsApiResponse);
      },
      { limit: 10 }
    );

#### accessToken

This required value is returned as part of the response object of the authentication.

#### endpoint

This required parameter specifies the type of API request you wish to make. All endpoints are listed in the [API docs](https://www.airseed.com/api/docs).

#### callback

This optional callback takes in one parameter through which the API response will be passed.

#### params

This optional parameter is an object containing key value pairs for parameters attached to the API request. All possible parameters are listed in the [API docs](https://www.airseed.com/api/docs) under each endpoint.

## Contributing

1. Fork it ( https://github.com/[my-github-username]/airseed.js/fork )
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request

