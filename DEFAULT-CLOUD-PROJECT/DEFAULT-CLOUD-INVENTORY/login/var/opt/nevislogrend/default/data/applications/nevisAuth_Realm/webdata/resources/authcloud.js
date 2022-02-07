/*
 * Authentication Cloud JavaScript
 * which is included in nevisAdmin 4 pattern to poll status.
 *
 * This code currently makes the following assumptions:
 * - JQuery is loaded and available on the page.
 * - The browser supports:
 *   - fetch
 *   - async / await
 */

/** URL of the Authentication Cloud API */
let backendURL;
/** Status Token to check status of processes in the Authentication Cloud API. */
let statusToken;
/** The JQuery object of HTML form with cloud_mobile_auth id. */
let $form;
/** The JQuery object of div inside the form. */
let $formGroupDiv;

const Status = {
    _pollInterval: 2 * 1000, // Check every 2 seconds
    latest: null,

    startPolling: function (token, uiCallback) {
        let interval = setInterval(async () => {
            await this._check(token).then(function (resp) {
                console.log("Polling status: %o", resp);
                uiCallback && uiCallback(resp, false);
                return Status.latest = resp;
            })
                .catch(function (err) {
                    console.error("Error during polling: %o", err);
                    return false;
                });

            if (Status.latest && (Status.latest.status === 'succeeded' || Status.latest.status === 'failed' || Status.latest.status === 'unknown')) {
                // Done!
                console.log('Latest status is: %o', this.latest);
                uiCallback && uiCallback(this.latest, true);
                clearInterval(interval);
            }
        }, this._pollInterval);
    },

    _check: async function (token) {
        const payload = {statusToken: token};
        const response = await fetch(backendURL + 'api/v1/status', {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'omit',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(payload),
            redirect: 'follow',
            referrerPolicy: 'no-referrer'
        });

        return await response.json();
    }
};

const Spinner = {
    _spinner: null,

    show: function($formGroupDiv) {
        this._spinner = $('<div class="lds-ring"><div></div><div></div><div></div><div></div></div><br/>')
            .prependTo($formGroupDiv);
    },

    hide: function () {
        this._spinner.hide();
    }
};

const Message = {
    _messageElement: null,

    show: function(message) {
        if (!this._messageElement) {
            // Append the message paragraph to the div with class form-group
            this._messageElement = $('<p/>')
            .attr('id', 'message')
            .prependTo($formGroupDiv);
        }
        this._messageElement.text(message);
    },

    success: function(message) {
        this._messageElement.addClass('bg-success');
        this.show(message)
    },

    failure: function(message) {
        this._messageElement.addClass('bg-danger');
        this.show(message)
    },
};

function messageCheckPhone() {
    if ($("#language").text() == 'de') {
        Message.show('Bitte überprüfen Sie ihr Mobiltelefon!');
    }
    else {
        Message.show('Please check your phone!');
    }
}

function messageSuccess() {
    if ($("#language").text() == 'de') {
        Message.success('\u2713 Login erfolgreich.');
    }
    else {
        Message.success('\u2713 You have been successfully authenticated.');
    }
}

function messageFailed() {
    if ($("#language").text() == 'de') {
        Message.failure('\u274C Login fehlgeschlagen.');
    }
    else {
        Message.failure('\u274C Failed to confirm login / transaction.');
    }
}

function messageScanQR() {
    if ($("#language").text() == 'de') {
        Message.show('Bitte QR code mit der Access App scannen');
    }
    else {
        Message.show('Scan the QR code with your Access App');
    }
}

function messageRegisterSuccess() {
    if ($("#language").text() == 'de') {
        Message.success('\u2713 Access App erfolgreich registriert.');
    }
    else {
        Message.success('\u2713 Access App registration was successful.');
    }
}

function messageRegisterFailed() {
    if ($("#language").text() == 'de') {
        Message.failure('\u274C Registrierung der Access App fehlgeschlagen.');
    }
    else {
        Message.failure('\u274C Failed to register Access App.');
    }
}

function title() {
    return $form.find('.logintitle')
}

function titleEnroll() {
    if ($("#language").text() == 'de') {
        title().text('Access App Registrierung');
    }
    else {
        title().text('Access App Registration');
    }
}

function titleLogin() {
    if ($("#language").text() == 'de') {
        title().text('Login');
    }
    else {
        title().text('Login');
    }
}

function setDeepLinkButtonLabel(button) {
    if ($("#language").text() == 'de') {
        button.text('Zur Access App')
    }
    else {
        button.text('Continue in app')
    }
}

const Enrollment = {

    _elem: null, // QR code or deep link depending on device

    show: function (qrCodeDataURI, appLink, $formGroupDiv) {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isIphone = 'iPhone' === navigator.platform;
        const isAndroid = /android/i.test(userAgent) && /mobile/i.test(userAgent);
        if (isAndroid || isIphone) {
            this._elem = $('<a />')
                .attr('href', appLink)
                .attr('class', 'btn btn-primary')
                .appendTo($formGroupDiv);
            setDeepLinkButtonLabel(this._elem);
        }
        else {
            messageScanQR();
            this._elem = $('<img />')
                .attr('id', 'enroll-qrcode')
                .attr('class', 'desktop')
                .attr('src', qrCodeDataURI)
                .attr('alt', 'QR Code to scan with the Access App')
                .width('300px').height('300px')
                .appendTo($formGroupDiv);
        }
    },

    hide: function() {
        this._elem.hide(); // hide the element which was shown
    }
};

function enrollUser(qrCodeDataURI, appLink) {

    if (!qrCodeDataURI || !appLink) {
        throw new Error('Failed to get QR code data URI / app link.')
    }

    titleEnroll();

    Enrollment.show(qrCodeDataURI, appLink, $formGroupDiv);

    console.log('Starting user enrollment status polling...');
    Spinner.show($formGroupDiv);

    Status.startPolling(statusToken, (st, done) => {

        if (st.status === 'succeeded') {
            console.log('Authenticator registration was successful.');

            Enrollment.hide();
            Spinner.hide();

            messageRegisterSuccess();
            $(':button[name=success]').show();

            // remove hidden field as ModSecurity finds it suspicious.
            $("input[name=qrCode]").remove();
        }
        else if (st.status === 'failed' || st.status === 'unknown') {
            console.error('Failed to register authenticator.');

            Enrollment.hide();
            Spinner.hide();

            messageRegisterFailed();
            $(':button[name=failure]').show();

            // remove hidden field as ModSecurity finds it suspicious.
            $("input[name=qrCode]").remove();
        }
    });
}

function transactionApproval() {

    titleLogin();

    messageCheckPhone();

    console.log('Starting login / transaction confirmation status polling...');

    Spinner.show($formGroupDiv);

    Status.startPolling(statusToken, (st, done) => {

        if (st.status === 'succeeded') {
            console.log('Login / transaction confirmation was successful.');

            Spinner.hide();

            messageSuccess();

            if ($(':button[name=abort]').length > 0) {
                // hide abort button if it exists
                $(':button[name=abort]').hide();
            }

            $(':button[name=success]').show();
            $(':button[name=success]').delay(3000).click(); // automatically click button after 3s
        }
        else if (st.status === 'failed' || st.status === 'unknown') {
            console.error('Failed to confirm login / transaction.');

            Spinner.hide();

            messageFailed();

            $(':button[name=failure]').show();
        }
    });
}

function init() {
    // Only execute when the cloud_mobile_auth form is on the page
    $form = $('#cloud_mobile_auth');
    if (!$form.length) {
        console.log('cloud_mobile_auth form is NOT on the page, doing nothing.');
        return;
    }

    console.log('cloud_mobile_auth form is on the page. Starting Authentication Cloud script.');

    // Grab URL, status token and QR code data URI from hidden form inputs
    backendURL = $("input[name=url]").val();
    statusToken = $("input[name=statusToken]").val();

    if (!backendURL || !statusToken) {
        throw new Error('Failed to get URL, statusToken (null or undefined).')
    }

    $formGroupDiv = $form.find('.form-group');

    // initially hide success / failure buttons
    $(':button[name=success]').hide();
    $(':button[name=failure]').hide();

    /** QR code to display for user enrollment. */
    const qrCodeDataURI = $("input[name=qrCode]").val();

    /** Deep link for enrollment on mobile. */
    const appLink = $("input[name=appLink]").val();

    if (qrCodeDataURI || appLink) {
        enrollUser(qrCodeDataURI, appLink);
    }
    else {
        transactionApproval();
    }
}

$(function() {
    init();
});
