# Airseed.js

Airseed Javascript API for user authentication and insights API.

This library allows you to trigger the Airseed authentication flow from your webpage, and will provide to you information about the user who successfully authenticates.

## Quick Start

Initialize the airseed JS library with your app's client ID.

    airseed.init('5f14defac0736abe1841d479c480d8f6');

Bind something on the page so that when clicked, the Airseed authentication flow for the specified mail provider will trigger:

    airseed.bind({
      selector: '.login-with-gmail',
      provider: 'google_oauth2',
      flow: 'popup_window'
    });

Provide the success and failure handlers for authentication.

    airseed.success(function(data) {
      console.log('success:');
      console.log(data);
    });

    airseed.failure(function(data) {
      console.log('failure:');
      console.log(data);
    });

### Bind Parameters

`airseed.bind(...)` can be configured for Gmail, Yahoo, or Outlook mail providers. It can also be configured to trigger the Airseed Authentication Flow as a popup or page redirect.

#### provider

- **google_oauth2**: Gmail/Google+ authentication
- **yahoo**: Yahoo authentication
- **windowslive**: Outlook/Hotmail authentication

#### flow

- **popup_window**: will trigger Airseed Authentication inside of a popup window that closes upon finish
- **page_redirect**: will redirect your page to the start of the Airseed Authentication flow

## Contributing

1. Fork it ( https://github.com/[my-github-username]/airseed.js/fork )
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request

