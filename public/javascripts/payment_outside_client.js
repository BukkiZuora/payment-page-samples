var parameterArray = {};
var params = {};

var callback = function (response) {
  if (!response.success) {
    // Requesting hosted page failed. Error handling code should be added here. Simply forward to the callback url in sample code.
    var callbackUrl = '/payment_page/callback?';
    for (id in response) {
      callbackUrl =
        callbackUrl +
        id +
        '=' +
        encodeURIComponent(response[id]) +
        '&';
    }
    window.location.replace(callbackUrl);
  }
};

var clientErrorMessageCallback = function (key, code, message) {
  // Overwrite error messages generated by client-side validation.
  var errorMessage = message;

  switch (key) {
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
  }

  Z.sendErrorMessageToHpm(key, errorMessage);

  return;
};

function submitPage() {
  document.getElementById('errorMessage').innerHTML = '';
  if (document.getElementById('agreement').checked) {
    if (
      !Z.setAgreement(
        'External',
        'Recurring',
        'AmericanExpress,JCB,Visa,MasterCard,Discover',
        ''
      )
    )
      return;
  }
  Z.submit();
  return false;
}

function submitSucceed() {
  document.getElementById('submitButton').disabled = true;
}

var serverErrorMessageCallback = function () {
  // Overwrite field error messages generated by server-side validation.
  var existErrorField = false;
  for (key in parameterArray) {
    var keySplit = key.split('_');
    if (keySplit.length == 2 && keySplit[0] == 'errorField') {
      var errorMessage = parameterArray[key];
      switch (keySplit[1]) {
        case 'creditCardNumber':
          errorMessage = 'Please input correct credit card number.';
          break;
        case 'cardSecurityCode':
          break;
        case 'creditCardExpirationYear':
          break;
        case 'creditCardExpirationMonth':
          break;
        case 'creditCardType':
          break;
      }

      Z.sendErrorMessageToHpm(keySplit[1], errorMessage);
      existErrorField = true;
    }
  }
  if (!existErrorField) {
    var msg =
      'Validation failed on server side, Please check your input firstly.';
    if ('errorMessage' in parameterArray) {
      msg = parameterArray['errorMessage'];
    }
    Z.sendErrorMessageToHpm('error', msg);
  }
};

function submitFail(callbackQueryString, newToken, newSignature) {
  var zuoraDiv = document.getElementById('zuora_payment');
  zuoraDiv.innerHTML = '';

  var parameterString = callbackQueryString.split('&amp;');
  parameterArray = {};
  for (i = 0; (j = parameterString[i]); i++) {
    parameterArray[j.substring(0, j.indexOf('='))] = j.substring(
      j.indexOf('=') + 1,
      j.length
    );
  }

  // Replace new signature.
  params['token'] = newToken;
  params['signature'] = newSignature;
  Z.renderWithErrorHandler(
    params,
    null,
    callback,
    clientErrorMessageCallback
  );
  Z.runAfterRender(serverErrorMessageCallback);
}

function loadPaymentPages(data, prepopulateFields, req) {

  if(req.pagetype.split('-').at(-1)==='legacy') {
    hideAgreement();
  }

  params['token'] = data.token;
  params['signature'] = data.signature;
  params['key'] = data.key;
  params['tenantId'] = data.tenantId;
  params['id'] = data.pageId;
  params['param_supportedTypes'] =
    'AmericanExpress,JCB,Visa,MasterCard,Discover';
  params['url'] = data.url;
  // Please note that we need to send parameters according to our requiement.
  // For 3DS test
  // params["authorizationAmount"] = 12;
  params['field_accountId'] = req.accountid;
  // params["field_passthrough1"] = "Test_Value_Passthrough1";
  // params["paymentGateway"]="BlueSnap";
  // params["currency"] = "GBP";
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
    params['field_passthrough2'] = 'doPaymentTrue';
    params['field_passthrough3'] = req.accountid;
    params['field_passthrough4'] = req.pmamount;
    // params["field_passthrough5"]="USD";
    params[
      'paymentDescription'
    ] = `Shrey's subscription aka Salary :)`; // Currently supported by GoCardless SEPA
    if (req.invoiceIds) {
      params['documents'] = JSON.stringify(
        req.invoiceIds.split(',').map((invoice) => ({
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

  // For regeneration of signature
  params['field_passthrough1'] = data.pageId;
  params['field_passthrough6'] = req.authorizationtype;
  params['field_passthrough7'] = req.env;
  params['field_passthrough8'] = req.invoiceIds;
  params['field_passthrough9'] = req.currency;

  params['style'] = 'inline';
  params['submitEnabled'] = 'false';

  Z.renderWithErrorHandler(
    params,
    prepopulateFields,
    callback,
    clientErrorMessageCallback
  );
}
