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

app.post("/token", async (req, res) => {
  try {
    console.log("here");
    const { amount = "20.00", orderId = "1234567890" } = req.body;
    console.log("req.body", req.body);

    // Setup API credentials
    const merchantAuthentication =
      new APIContracts.MerchantAuthenticationType();
    merchantAuthentication.setName("5pNK6r87");
    merchantAuthentication.setTransactionKey("48vt6ZD5UWT28by3");

    // Create a transaction request
    const transactionRequest = new APIContracts.TransactionRequestType();
    transactionRequest.setTransactionType(
      APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION
    );
    transactionRequest.setAmount(amount);

    // Create the hosted payment page request
    const request = new APIContracts.GetHostedPaymentPageRequest();
    request.setMerchantAuthentication(merchantAuthentication);
    request.setTransactionRequest(transactionRequest);

    // Hosted form settings
    const setting1 = new APIContracts.SettingType();
    setting1.setSettingName("hostedPaymentButtonOptions");
    setting1.setSettingValue(JSON.stringify({ text: "Pay Now" }));

    const setting2 = new APIContracts.SettingType();
    setting2.setSettingName("hostedPaymentReturnOptions");
    setting2.setSettingValue(JSON.stringify({ showReceipt: false }));

    const setting4 = new APIContracts.SettingType();
    setting4.setSettingName("hostedPaymentIFrameCommunicatorUrl");
    setting4.setSettingValue(
      JSON.stringify({ url: "http://localhost:5000/iframe-communicator" })
    );

    request.addToHostedPaymentSettings(setting1);
    request.addToHostedPaymentSettings(setting2);
    request.addToHostedPaymentSettings(setting4);
    console.log("request", request);
    const controller = new APIControllers.GetHostedPaymentPageController(
      request
    );
    controller.execute((err, response) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const apiResponse = controller.getResponse();
      if (
        apiResponse.getMessages().getResultCode() !==
        APIContracts.MessageTypeEnum.OK
      ) {
        return res.status(400).json({ error: "Error fetching token" });
      }

      return res.json({ token: apiResponse.getToken() });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/iframe-communicator", (req, res) => {
  res.send(`
      <html>
      <head>
          <script>
              function callParentFunction(str) {
                  if (str && window.parent.parent.CommunicationHandler) {
                      window.parent.parent.CommunicationHandler.onReceiveCommunication({ qstr: str });
                  }
              }

              function receiveMessage(event) {
                  if (event.data) {
                      callParentFunction(event.data);
                  }
              }

              window.addEventListener("message", receiveMessage, false);
              if (window.location.hash.length > 1) {
                  callParentFunction(window.location.hash.substring(1));
              }
          </script>
      </head>
      <body></body>
      </html>
  `);
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

app.get('/checkout/payment/response', (req, res) => {
  res.sendFile(__dirname + '/iframe-communicator.html');
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
