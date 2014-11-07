window.airseed = (function () {
  var ERR_MISSING_CLIENT_ID = "Airseed: Missing client ID. Please call airseed.init('...') with valid client ID first.";
  var ERR_MISSING_SELECTOR  = "Airseed: Missing CSS selector to bind click event.";
  var ERR_MISSING_PROVIDER  = "Airseed: Missing authentication provider for Airseed auth. Please provide 'gmail', 'yahoo', or 'outlook'.";
  var ERR_MISSING_ELEMENTS  = "Airseed: Invalid selector. Unable to locate specified elements on page.";
  var ERR_INVALID_ACCESS_TOKEN = "Airseed: Received invalid user access token.";
  var ERR_FAILED_USER_INFO  = "Airseed: Failed to fetch /v1/users/me.json endpoint info.";

  var FLOW_POPUP_WINDOW  = 'popup_window';
  var FLOW_PAGE_REDIRECT = 'page_redirect';

  var AIRSEED_AUTH_URL_ORIGIN = 'https://auth.airseed.com';
  var AIRSEED_AUTH_URL = AIRSEED_AUTH_URL_ORIGIN + '/oauth/authenticate';
  var AIRSEED_TOKEN_VERIFICATION_URL = AIRSEED_AUTH_URL_ORIGIN + '/oauth/tokeninfo';

  var AIRSEED_API_URL_ORIGIN = 'https://api.airseed.com';
  var AIRSEED_API_ME_URL = AIRSEED_API_URL_ORIGIN + '/v1/users/me.json';

  var POPUP_WIDTH  = 500;
  var POPUP_HEIGHT = 500;
  var POPUP_WINDOWS = {};

  var airseed;

  var _getElements = function(selector) {
      var elements;
      if (typeof selector === "string") {
          elements = document.querySelectorAll(selector);
      } else if (selector.length) {
          elements = selector;
      } else {
          elements = [selector];
      }
      return elements;
  };

  var _formatAuthURL = function(appClientId, provider) {
    return AIRSEED_AUTH_URL += '?provider=' + provider + '&client_id=' + appClientId;
  };

  var _triggerPopup = function(url, callbackUrl, provider) {
    var windowName = Math.random().toString(36).substring(7);
    var left  = (screen.width / 2) - (POPUP_WIDTH / 2);
    var top   = (screen.height / 2) - (POPUP_HEIGHT / 2);
    var popup = window.open(
                  url + '&clientside=js', windowName,
                  "toolbar=yes, scrollbars=yes, resizable=yes, width=" + POPUP_WIDTH + 
                  ", height=" + POPUP_HEIGHT + " top=" + top + ", left="+ left
                );

    POPUP_WINDOWS[windowName] = {
      callbackUrl: callbackUrl,
      popupWindow: popup,
      provider: provider
    };
  };

  var _triggerRedirect = function(url, callbackUrl) {
    window.location.href = url += '&redirect_uri=' + callbackUrl;
  };

  var _initializeAuthButtons = function(elements, options) {
    var authUrl = _formatAuthURL(airseed._appClientId, options.provider);
    for (i = 0; i < elements.length; i++) {
      elements[i].addEventListener('click', function() {
        if (options.flow == FLOW_POPUP_WINDOW) {
          _triggerPopup(authUrl, options.callbackUrl, options.provider);
        } else {
          _triggerRedirect(authUrl, options.callbackUrl);
        }
      });
    }
  };

  var _validateAccessToken = function(tokenInfoResponse) {
    try {
      return JSON.parse(tokenInfoResponse);
    } catch(err) {
      airseed._failureCallback({message: ERR_INVALID_ACCESS_TOKEN});
      throw ERR_INVALID_ACCESS_TOKEN;
    }
  };
  var _parseUserResponse = function(userInfoResponse) {
    try {
      return JSON.parse(userInfoResponse);
    } catch(err) {
      airseed._failureCallback({message: ERR_FAILED_USER_INFO});
      throw ERR_FAILED_USER_INFO;
    }
  };

  var _fetchAndReturnUserInfo = function(userTokens) {
    var tokenInfoRequest = new XMLHttpRequest();
    tokenInfoRequest.onload = function reqListener () {
      var userInfo = _parseUserResponse(tokenInfoRequest.responseText);
      if (userInfo) {
        airseed._successCallback(userInfo);
      } else {
        airseed._failureCallback({message: ERR_FAILED_USER_INFO});
      }
    };
    tokenInfoRequest.open("get", AIRSEED_API_ME_URL, true);
    tokenInfoRequest.setRequestHeader("Authorization", "Bearer " + userTokens.access_token);
    tokenInfoRequest.send();
  };

  var _redirectTokensToCallbackUrl = function(userTokens, callbackUrl) {
    var queryString = [];
    for (var p in userTokens) {
      if (userTokens.hasOwnProperty(p)) {
        queryString.push(encodeURIComponent(p) + "=" + encodeURIComponent(userTokens[p]));
      }
    }

    var formattedCallbackUrl = callbackUrl + "?" + queryString.join("&");
    window.location.href = formattedCallbackUrl;
  };

  var _handlePopupMessage = function(event) {
    if (event.origin !== AIRSEED_AUTH_URL_ORIGIN) return;
    if (!event.data.access_token) return;

    var callbackUrl = POPUP_WINDOWS[event.data.popupName].callbackUrl;

    var tokenInfoRequest = new XMLHttpRequest();
    tokenInfoRequest.onload = function reqListener () {
      var validated = _validateAccessToken(tokenInfoRequest.responseText);
      if (!validated) return;

      if (!callbackUrl) {
        _fetchAndReturnUserInfo(event.data);
      } else {
        _redirectTokensToCallbackUrl(event.data, callbackUrl);
      }
    };
    tokenInfoRequest.open("get", AIRSEED_TOKEN_VERIFICATION_URL + 
      '?access_token=' + event.data.access_token, true);
    tokenInfoRequest.send();
  };

  var _initPopupMessageListener = function() {
    window.addEventListener("message", _handlePopupMessage, false);
  };

  airseed = {
    init: function (appClientId) {
      this._appClientId = appClientId;
      this._failureCallback = function() {};
      this._successCallback = function() {};
      _initPopupMessageListener();
    },

    bind: function(options) {
      if (!this._appClientId) throw ERR_MISSING_CLIENT_ID;
      if (!options.selector) throw ERR_MISSING_SELECTOR;
      if (!options.provider) throw ERR_MISSING_PROVIDER;
      var elements = _getElements(options.selector);
      if (!elements) throw ERR_MISSING_ELEMENTS;
      _initializeAuthButtons(elements, options);
    },

    success: function(successCallback) {
      this._successCallback = successCallback;
    },

    failure: function(failureCallback) {
      this._failureCallback = failureCallback;
    }
  };

  return airseed;
}());