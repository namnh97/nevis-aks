(function() {

  /**
   * Create a new script tag pointing to Mobile Authentication JS and append it to body.
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
    console.log('Mobile Authentication script appended to body with URL: ', scriptUrl);
  }

  /**
   * Returns the NEVIS login form name which is currently displayed on the page.
   */
  function getFormName() {
    const scriptTag = $('script[data-form-name]');
    if (!scriptTag.length) {
      console.error('Unable to look up Mobile Authentication script tag. Please include the script tag with data-form-name attribute!');
      return;
    }
    return scriptTag.attr('data-form-name');
  }

  $(function () {

    const formName = getFormName();
    if (!formName) {
      console.error('Failed to check if Mobile Authentication form is displayed. Cannot determine form name.');
      return;
    }

    // only trigger our JS if mobile auth login form is displayed.
    if ('oobloginform' !== formName) {
      return;
    }

    console.log('oobloginform form is on the page. Appending Mobile Authentication JS...');

    // determine URL of sibling mauth.js based on script element for this JS
    var src = document.getElementById("mauth_include").src;
    const scriptUrl = src.substring(0, src.lastIndexOf("/")) + '/mauth.js';
    if (!scriptUrl) {
      console.error('Unable get script URL for Mobile Authentication. Giving up.');
      return;
    }

    appendScriptToBody(scriptUrl, function() {
      // we trigger the execution of Mobile Authentication JavaScript.
      console.log('Start execution of Mobile Authentication JS.');
      var authLogin = nevisMobileAuthLogin();
      authLogin.init({ autoSubmit: true, debug: true});
    });
  });
})();
