const PURCHASE_ORDER_TEMPLATE_ID = "165nqyULE4yhGEwhj2vGofDrPwOsvIrgtL7Vamdkn-a8";
const PURCHASE_ORDER_FOLDER_ID = "1PGjujm1FdR4dhM9uFG7rSuf68wX6Eo3_";

function createPurchaseOrder(payload) {
  const requiredFields = [
    "date",
    "orderNo",
    "partyName",
    "address",
    "kindlyAttn",
    "contactNo",
  ];

  requiredFields.forEach(function (field) {
    if (!payload[field]) {
      throw new Error("Missing required field: " + field);
    }
  });

  var items = Array.isArray(payload.items) && payload.items.length
    ? payload.items
    : [{
        productName: "",
        unit: "",
        price: "",
        freight: "",
        delivered: "",
        payment: "",
        rateValidity: "",
      }];

  var folder = DriveApp.getFolderById(PURCHASE_ORDER_FOLDER_ID);
  var templateFile = DriveApp.getFileById(PURCHASE_ORDER_TEMPLATE_ID);
  var copyName = "PO_" + payload.orderNo.replace(/[\\/:*?\"<>|]/g, "_");
  var docFile = templateFile.makeCopy(copyName, folder);
  var docId = docFile.getId();
  var doc = DocumentApp.openById(docId);
  var body = doc.getBody();

  replaceTemplateText_(body, {
    "{{DATE}}": payload.date,
    "{{ORDER_NO}}": payload.orderNo,
    "{{PARTY_NAME}}": payload.partyName,
    "{{ADDRESS}}": payload.address,
    "{{KINDLY_ATTN}}": payload.kindlyAttn,
    "{{CONTACT_NO}}": payload.contactNo,
    "{{PRODUCT_NAME}}": joinItemValues_(items, "productName"),
    "{{UNIT}}": joinItemValues_(items, "unit"),
    "{{PRICE}}": joinItemValues_(items, "price"),
    "{{FREIGHT}}": joinItemValues_(items, "freight"),
    "{{DELIVERED}}": joinItemValues_(items, "delivered"),
    "{{PAYMENT}}": joinItemValues_(items, "payment"),
    "{{RAT_VALIDITY}}": joinItemValues_(items, "rateValidity"),
    "{{PDF_EDIT_URL}}": "",
    "{{PDF_URL}}": "",
  });

  doc.saveAndClose();

  var pdfBlob = docFile.getAs(MimeType.PDF).setName(copyName + ".pdf");
  var pdfFile = folder.createFile(pdfBlob);
  pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var editUrl = "https://docs.google.com/document/d/" + docId + "/edit";
  var pdfUrl = "https://drive.google.com/file/d/" + pdfFile.getId() + "/view";

  var docForUrls = DocumentApp.openById(docId);
  var urlBody = docForUrls.getBody();
  replaceTemplateText_(urlBody, {
    "{{PDF_EDIT_URL}}": editUrl,
    "{{PDF_URL}}": pdfUrl,
  });
  docForUrls.saveAndClose();

  appendPurchaseOrderRow_(payload, items, editUrl, pdfUrl);

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: "Purchase Order created successfully",
    editUrl: editUrl,
    pdfUrl: pdfUrl,
    docId: docId,
    pdfFileId: pdfFile.getId(),
  })).setMimeType(ContentService.MimeType.JSON);
}

function appendPurchaseOrderRow_(payload, items, editUrl, pdfUrl) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName("Purchase Order");
  if (!sheet) {
    throw new Error("Sheet 'Purchase Order' not found");
  }

  sheet.appendRow([
    payload.date || "",
    payload.orderNo || "",
    payload.partyName || "",
    payload.address || "",
    payload.kindlyAttn || "",
    payload.contactNo || "",
    joinItemValues_(items, "productName"),
    joinItemValues_(items, "unit"),
    joinItemValues_(items, "price"),
    joinItemValues_(items, "freight"),
    joinItemValues_(items, "delivered"),
    joinItemValues_(items, "payment"),
    editUrl,
    pdfUrl,
    joinItemValues_(items, "rateValidity"),
  ]);
}

function joinItemValues_(items, key) {
  return items
    .map(function (item) {
      return item[key] || "";
    })
    .filter(function (value) {
      return value !== "";
    })
    .join("\n");
}

function replaceTemplateText_(body, replacements) {
  Object.keys(replacements).forEach(function (key) {
    body.replaceText(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), replacements[key]);
  });
}

/*
Add this branch inside your existing doPost(e):

else if (action === 'createPurchaseOrder') {
  var payload = JSON.parse(params.payload || '{}');
  return createPurchaseOrder(payload);
}

Template placeholder names expected in the Google Doc:
{{DATE}}, {{ORDER_NO}}, {{PARTY_NAME}}, {{ADDRESS}}, {{KINDLY_ATTN}}, {{CONTACT_NO}},
{{PRODUCT_NAME}}, {{UNIT}}, {{PRICE}}, {{FREIGHT}}, {{DELIVERED}}, {{PAYMENT}},
{{PDF_EDIT_URL}}, {{PDF_URL}}, {{RAT_VALIDITY}}
*/
