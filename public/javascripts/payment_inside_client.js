function forwardCallbackURL(response) {
  var callbackUrl = '/payment_result?';
  for (id in response) {
    callbackUrl =
      callbackUrl + id + '=' + encodeURIComponent(response[id]) + '&';
  }
  console.log(callbackUrl);
  window.location.replace(callbackUrl);
}

var callback = function (response) {
  if (response.responseFrom == 'Response_From_Submit_Page') {
    if (response.success) {
      // Submitting hosted page succeeds. Business logic code may be added here. Simply forward to the callback url in sample code.
      forwardCallbackURL(response);
    } else {
      // Submitting hosted page fails. Error handling code should be added here. Simply forward to the callback url in sample code.
      forwardCallbackURL(response);
    }
  } else if (response.responseFrom == 'Response_From_3D_Validation') {
    // Requesting hosted page fails. Error handling code should be added here. Simply forward to the callback url in sample code.
    console.log(
      'In Sample Code: \n ThreeDSResult:' +
        response.ThreeDSResult +
        '\n AuthorizeResult: ' +
        response.AuthorizeResult +
        '\n threedPaymentMethodId: ' +
        response.threedPaymentMethodId +
        '\n AuthTransactionId: ' +
        response.AuthTransactionId +
        '\n ECI: ' +
        response.ECI +
        '\n XID: ' +
        response.XID +
        '\n CAVV: ' +
        response.CAVV +
        '\n field_passthrough1: ' +
        response.field_passthrough1 +
        '\n field_passthrough2: ' +
        response.field_passthrough2
    );

    forwardCallbackURL(response);
  } else {
    // Requesting hosted page fails. Error handling code should be added here. Simply forward to the callback url in sample code.
    forwardCallbackURL(response);
  }
};

var errorMessageCallback = function (key, code, message) {
  var errorMessage = message;

  switch (key) {
    // Overwrite error messages generated by client-side validation.
    case 'creditCardNumber':
      if (code == '001') {
        errorMessage = 'Card number required. Please input firstly.';
      } else if (code == '002') {
        errorMessage =
          'Number does not match credit card. Please try again.';
      }
      break;
    case 'cardSecurityCode':
      break;
    case 'creditCardExpirationYear':
      break;
    case 'creditCardExpirationMonth':
      break;
    case 'creditCardType':
      break;

    // Overwrite error messages generated by server-side validation.
    case 'error':
      if (
        errorMessage ===
        '[Attempt_Exceed_Limitation] Attempt exceed the limitation, refresh page to try again.'
      ) {
        const attemptexceed =
          document.getElementById('attemptexceed');
        attemptexceed.style.display = 'block';
        setTimeout(function () {
          window.location.reload();
        }, 5000);
      }
      // errorMessage ="Validation failed on server side, Please check your input firstly.";
      break;
  }

  Z.sendErrorMessageToHpm(key, errorMessage);

  return;
};

function loadPaymentPages(data, prepopulateFields, req) {
  var params = {};
  params['token'] = data.token;
  params['signature'] = data.signature;
  params['key'] = data.key;
  params['tenantId'] = data.tenantId;
  params['id'] = data.pageId;
  params['param_supportedTypes'] =
    'AmericanExpress,JCB,Visa,MasterCard,Discover';
  params['url'] = data.url;
  // params['locale'] = 'fr';

  // Please note that we need to send parameters according to our requiement.
  // For 3DS test
  // params["authorizationAmount"] = 12;
  // params["field_accountId"] = "8adcf5348409a8190184146e5cb12bd3";
  params['field_accountId'] = req.accountid;
  // params["field_passthrough1"] = "Test_Value_Passthrough1";
  // params["paymentGateway"]="BlueSnap";
  // params["currency"] = "USD";
  // Page Id is required to Regenerate signature and token, and regenerate signature is required when reCAPTCHA function is enabled and when submit failed in button out model.
  // params["field_passthrough3"] = data.pageId;
  // params.put("currency", "GBP");

  if (req.integrationtype === 'onSessionPayment') {
    if (req.storepm === 'on') {
      params['storePaymentMethod'] = 'true';
    } else {
      params['storePaymentMethod'] = 'false';
    }
    params['doPayment'] = 'true';
    params['field_accountId'] = req.accountid;

    params['currency'] = req.currency;
    params[
      'paymentDescription'
    ] = `Shrey's subscription aka Salary :)`; // Currently supported by GoCardless SEPA
    if (req.invoiceIds) {
      params['documents'] = JSON.stringify(
        req.invoiceIds
          .split(',')
          .map((invoice) => ({
            type: 'invoice',
            ref: invoice.trim(),
          }))
      );
    } else {
      params['authorizationAmount'] = req.pmamount;
    }
  } else {
    // This overides the auth amount used for validating the PM.
    params['authorizationAmount'] = req.pmamount;
  }

  if (req.pagetype === 'inside') {
    params['style'] = 'inline';
  } else {
    params['style'] = 'overlay';
  }

  params['submitEnabled'] = 'true';
  Z.renderWithErrorHandler(
    params,
    prepopulateFields,
    callback,
    errorMessageCallback
  );
}

function agree() {
  if (document.getElementById('agreement').checked) {
    if (
      !Z.setAgreement(
        'External',
        'Recurring',
        'Visa',
        'http://www.google.com'
      )
    )
      return;
  } else {
    if (!Z.setAgreement('', '', '', '')) return;
  }
}
/**
 * javascript method for button outside of iframe
 * @returns
 */
function submitPage() {
  Z.submit();
  return false;
}

function submitSucceed() {
  document.getElementById('submitButton').disabled = true;
}
