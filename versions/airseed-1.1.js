/* Airseed JS v1.1 */

window.airseed = (function () {
  var ERR_MISSING_CLIENT_ID = "Airseed: Missing client ID. Please call airseed.init('...') with valid client ID first.";
  var ERR_MISSING_SELECTOR  = "Airseed: Missing CSS selector to bind click event.";
  var ERR_MISSING_ELEMENTS  = "Airseed: Invalid selector. Unable to locate specified elements on page.";
  var ERR_MISSING_ACCESS_TOKEN = "Airseed: Missing access token required for user API requests.";
  var ERR_MISSING_ENDPINt   = "Airseed: Missing endpoint required for user API requests.";
  var ERR_INVALID_ACCESS_TOKEN = "Airseed: Received invalid user access token.";
  var ERR_FAILED_USER_INFO  = "Airseed: Failed to fetch /v1/users/me.json endpoint info.";
  var ERR_FAILED_USER_API   = "Airseed: Failed to fetch a proper API endpoint response.";

  var CLIENTSIDE_OPTIONS = ['selector', 'provider', 'flow', 'callbackUrl'];
  var FLOW_POPUP_WINDOW  = 'popup_window';
  var FLOW_PAGE_REDIRECT = 'page_redirect';

  var AIRSEED_AUTH_BASE_URL = 'https://auth.airseed.com';
  var AIRSEED_API_BASE_URL  = 'https://api.airseed.com';

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

  var _getAuthBaseURL = function() {
    return airseed._authBaseUrl || AIRSEED_AUTH_BASE_URL;
  };

  var _getApiBaseURL = function() {
    return airseed._apiBaseUrl || AIRSEED_API_BASE_URL;
  };

  var _formatAuthURL = function(appClientId, options) {
    var authUrl = _getAuthBaseURL() + '/oauth/authenticate?client_id=' + appClientId;
    if (options.provider)
      authUrl += '&provider=' + options.provider;

    for (var property in options) {
      // if not already handling the param
      if (CLIENTSIDE_OPTIONS.indexOf(property) < 0) {
        var key = property.replace(/([A-Z])/g, function($1) { return "_"+$1.toLowerCase(); });
        var value = options[property];
        authUrl += '&' + key + '=' + value;
      }
    }

    return encodeURI(authUrl);
  };

  var _triggerPopup = function(url, callbackUrl, provider) {
    var windowName = Math.random().toString(36).substring(7);
    var left  = (screen.availWidth / 2) - (POPUP_WIDTH / 2);
    var top   = (screen.availHeight / 2) - (POPUP_HEIGHT / 2);
    var popup = window.open(
                  url + '&clientside=js', windowName,
                  "toolbar=yes, scrollbars=yes, resizable=yes, width=" + POPUP_WIDTH + 
                  ", height=" + POPUP_HEIGHT + ", top=" + top + ", left="+ left
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
    for (i = 0; i < elements.length; i++) {
      elements[i].addEventListener('click', function() {
        var authUrl = _formatAuthURL(airseed._appClientId, options);
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

  var _parseApiResponse = function(apiResponse) {
    try {
      return JSON.parse(apiResponse);
    } catch(err) {
      throw ERR_FAILED_USER_API;
    }
  };

  var _fetchAndReturnUserInfo = function(userTokens) {
    var tokenInfoRequest = new XMLHttpRequest();
    tokenInfoRequest.onload = function reqListener () {
      var userInfo = _parseUserResponse(tokenInfoRequest.responseText);
      if (userInfo) {
        airseed._successCallback(userInfo, userTokens);
      } else {
        airseed._failureCallback({message: ERR_FAILED_USER_INFO});
      }
    };
    tokenInfoRequest.open("get", _getApiBaseURL() + '/v1/users/me.json', true);
    tokenInfoRequest.setRequestHeader("Authorization", "Bearer " + userTokens.access_token);
    tokenInfoRequest.send();
  };

  var _fetchAndReturnUserAPIResponse = function(accessToken, endpoint, callback, params) {
    paramString = _serializeObjectToQueryString(params);

    var apiRequest = new XMLHttpRequest();
    apiRequest.onload = function reqListener () {
      var apiResponse = _parseApiResponse(apiRequest.responseText);
      if (apiResponse) {
        callback(apiResponse);
      } else {
        throw ERR_FAILED_USER_API;
      }
    };
    apiRequest.open("get",
      _getApiBaseURL() + '/v1/users/me/' + endpoint + '.json' + '?' + paramString,
      true
    );
    apiRequest.setRequestHeader("Authorization", "Bearer " + accessToken);
    apiRequest.send();
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
    if (event.origin !== _getAuthBaseURL()) return;
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
    tokenInfoRequest.open("get", _getAuthBaseURL() +
      '/oauth/tokeninfo?access_token=' + event.data.access_token, true);
    tokenInfoRequest.send();
  };

  var _initPopupMessageListener = function() {
    window.addEventListener("message", _handlePopupMessage, false);
  };

  var _serializeObjectToQueryString = function(obj) {
    var str = [];
    for(var p in obj)
      if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      }
    return str.join("&");
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
      var elements = _getElements(options.selector);
      if (!elements) throw ERR_MISSING_ELEMENTS;
      _initializeAuthButtons(elements, options);
    },

    success: function(successCallback) {
      this._successCallback = successCallback;
    },

    failure: function(failureCallback) {
      this._failureCallback = failureCallback;
    },

    userAPI: function(accessToken, endpoint, callback, params) {
      if (!accessToken) throw ERR_MISSING_ACCESS_TOKEN;
      if (!endpoint) throw ERR_MISSING_ENDPOINT;
      params = typeof params !== 'undefined' ? params : {};
      _fetchAndReturnUserAPIResponse(accessToken, endpoint, callback, params);
    },

    config: function(options) {
      this._authBaseUrl = options.authBaseUrl;
      this._apiBaseUrl = options.apiBaseUrl;
    }
  };

  return airseed;
}());