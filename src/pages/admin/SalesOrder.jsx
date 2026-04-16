import SalesDocumentBuilder from "../../components/SalesDocumentBuilder";

const SalesOrder = () => {
  return (
    <SalesDocumentBuilder
      pageTitle="Generate Sales Order"
      pageCode="SO Document Builder"
      documentLabel="Sales Order"
      documentNumberPrefix="SO"
      saveLabel="Save SO"
      footerLabel="This is a computer generated sales order draft."
      noteTemplate={`1. Delivery schedule: As per confirmed dispatch timeline.\n2. Payment terms: As per approved customer terms.\n3. Material acceptance: Subject to final confirmation and availability.`}
    />
  );
};

export default SalesOrder;
