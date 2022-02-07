(function() {

  /**
   * Create a new script tag pointing to Authentication Cloud JS and append it to body.
   *
   * @param scriptUrl The URL of JS to load.
   * @param callback The callback function to be invoked when the script is loaded.
   */
  function appendScriptToBody(scriptUrl, callback) {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = scriptUrl;
    script.onload = () => callback(script);
    document.body.appendChild(script);
    console.log('Authentication Cloud script is appended to body with URL: ', scriptUrl);
  }

  /**
   * Returns the NEVIS login form name which is currently displayed on the page.
   */
  function getFormName() {
    const scriptTag = $('script[data-form-name]');
    if (!scriptTag.length) {
      console.error('Unable to look up Authentication Cloud script tag. Please include the script tag with data-form-name attribute!');
      return;
    }
    return scriptTag.attr('data-form-name');
  }

  function getAuthenticationCloudURL() {
    // Get the URl of Authentication Cloud instance from hidden HTML field.
    const form = $('#cloud_mobile_auth');
    if (!form.length) {
      console.error('Unable to look up cloud_mobile_auth form. Probably it is missing from the page. Please report a bug!');
      return;
    }

    let urlField = form.find('input[name=url]');
    if (!urlField.length) {
      console.error('Unable to look up hidden URL input field. Probably it is missing on cloud_mobile_auth form on the page. Please report a bug!');
      return;
    }

    const url = urlField.val();
    if (!url) {
      console.error('Unable to get Authentication Cloud instance URL from hidden field. Please report a bug!');
      return;
    }

    console.log('Detected Authentication Cloud instance URL: ', url);
    return url;
  }

  function addCss(fileName) {
    const head = document.head;
    const link = document.createElement("link");

    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = fileName;

    head.appendChild(link);
  }

  $(function () {

    const formName = getFormName();
    if (!formName) {
      console.error('Failed to check if Authentication Cloud login form is displayed. Cannot determine form name.');
      return;
    }

    // Only trigger our JS if Authentication Cloud login form is displayed.
    if ('cloud_mobile_auth' !== formName) {
      return;
    }

    console.log('cloud_mobile_auth form is on the page. Appending Authentication Cloud JavaScript...');

    let authenticationCloudURL = getAuthenticationCloudURL();

    // determine URL of sibling authcloud.js based on script element for this JS
    var src = document.getElementById("authcloud_include").src;
    const scriptUrl = src.substring(0, src.lastIndexOf("/")) + '/authcloud.js';
    if (!scriptUrl) {
      console.error('Unable get script URL for Authentication Cloud. Giving up.');
      return;
    }

    const spinnerCssUrl = authenticationCloudURL + 'spinner.css';
    addCss(spinnerCssUrl);

    appendScriptToBody(scriptUrl, function() {
      // we trigger the execution of Authentication Cloud JavaScript.
      console.log('Start the execution of Authentication Cloud JavaScript');
    });
  });
})();
