const express = require("express");
const axios = require("axios");
const cors = require("cors");
// const dotenv = require("dotenv");
var ApiContracts = require("authorizenet").APIContracts;
var ApiControllers = require("authorizenet").APIControllers;

// dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const AUTHORIZE_NET_API = "https://test.authorize.net/payment/payment";

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World");
});

// Route to fetch form token
app.get("/api/get-form-token", async (req, res) => {
  try {
    console.log("Getting form token");
    const response = await axios.post(
      AUTHORIZE_NET_API,
      {
        getHostedPaymentPageRequest: {
          merchantAuthentication: {
            name: "5CwDY77zFh",
            transactionKey: "9NwU72S2nK5Zz585",
          },
          transactionRequest: {
            transactionType: "authCaptureTransaction",
            amount: "20.00",
            profile: {
              customerProfileId: "123456789",
            },
            customer: {
              email: "ellen@mail.com",
            },
            billTo: {
              firstName: "Ellen",
              lastName: "Johnson",
              company: "Souveniropolis",
              address: "14 Main Street",
              city: "Pecan Springs",
              state: "TX",
              zip: "44628",
              country: "USA",
            },
          },
          hostedPaymentSettings: {
            setting: [
              {
                settingName: "hostedPaymentIFrameCommunicatorUrl",
                settingValue: "https://your-domain.com/iframeCommunicator.html",
              },
              {
                settingName: "hostedPaymentButtonOptions",
                settingValue: '{"text": "Pay Now"}',
              },
              {
                settingName: "hostedPaymentReturnOptions",
                settingValue:
                  '{"showReceipt": true, "url": "https://your-domain.com/success"}',
              },
            ],
          },
        },
      },
      { headers: { "Content-Type": "application/json" } }
    );
    // const res = JSON.parse(response.data);

    // Extract the data from the response
    const formToken = response.data;
    res.json({ formToken });
  } catch (error) {
    console.error("Error getting form token:", error);
    res.status(500).json({ error: "Failed to get form token" });
  }
});

app.post("/get-payment-form-token", async (req, res) => {
  try {
    var merchantAuthenticationType =
      new ApiContracts.MerchantAuthenticationType();
    merchantAuthenticationType.setName("5pNK6r87");
    merchantAuthenticationType.setTransactionKey("48vt6ZD5UWT28by3");
    console.log("merchantAuthenticationType", merchantAuthenticationType);
    var transactionRequestType = new ApiContracts.TransactionRequestType();
    transactionRequestType.setTransactionType(
      ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION
    );
    transactionRequestType.setAmount("42.68");

    var setting1 = new ApiContracts.SettingType();
    setting1.setSettingName("hostedPaymentButtonOptions");
    setting1.setSettingValue('{"text": "Pay"}');

    var setting2 = new ApiContracts.SettingType();
    setting2.setSettingName("hostedPaymentBillingAddressOptions");
    setting2.setSettingValue('{"show": false}');

    var setting3 = new ApiContracts.SettingType();
    setting3.setSettingName("hostedPaymentPaymentOptions");
    setting3.setSettingValue(
      '{"showCreditCard": true, "showBankAccount": false}'
    );

    // var setting4 = new ApiContracts.SettingType();
    // setting4.setSettingName("hostedPaymentReturnOptions");
    // setting4.setSettingValue(
    //   '{ "cancelUrl": "http://localhost:3000", "cancelUrlText": "Cancel"}'
    // );

    var settingList = [];
    // settingList.push(setting4);
    settingList.push(setting1);
    settingList.push(setting3);
    settingList.push(setting2);

    var alist = new ApiContracts.ArrayOfSetting();
    alist.setSetting(settingList);

    var getRequest = new ApiContracts.GetHostedPaymentPageRequest();
    getRequest.setMerchantAuthentication(merchantAuthenticationType);
    getRequest.setTransactionRequest(transactionRequestType);
    getRequest.setHostedPaymentSettings(alist);

    //console.log(JSON.stringify(getRequest.getJSON(), null, 2));
    console.log("getRequest", getRequest);
    var ctrl = new ApiControllers.GetHostedPaymentPageController(
      getRequest.getJSON()
    );

    ctrl.execute(function () {
      var apiResponse = ctrl.getResponse();

      if (apiResponse != null)
        var response = new ApiContracts.GetHostedPaymentPageResponse(
          apiResponse
        );

      //pretty print response
      //console.log(JSON.stringify(response, null, 2));

      if (response != null) {
        if (
          response.getMessages().getResultCode() ==
          ApiContracts.MessageTypeEnum.OK
        ) {
          console.log("Hosted payment page token :");
          console.log(response.getToken());
        } else {
          //console.log('Result Code: ' + response.getMessages().getResultCode());
          console.log(
            "Error Code: " + response.getMessages().getMessage()[0].getCode()
          );
          console.log(
            "Error message: " + response.getMessages().getMessage()[0].getText()
          );
        }
      } else {
        var apiError = ctrl.getError();
        console.log(apiError);
        console.log("Null response received");
      }
      const formToken = response.token;
      res.json({ formToken });
    });
  } catch (error) {
    // Handle any errors that occurred during the process
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
