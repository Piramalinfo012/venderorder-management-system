import SalesDocumentBuilder from "../../components/SalesDocumentBuilder";

const Quotation = () => {
  return (
    <SalesDocumentBuilder
      pageTitle="Generate Quotation"
      pageCode="Quotation Document Builder"
      documentLabel="Quotation"
      documentNumberPrefix="QTN"
      saveLabel="Save Quotation"
      footerLabel="This is a computer generated quotation draft."
      noteTemplate={`1. Validity: 30 days from quotation date.\n2. Delivery: Subject to stock availability.\n3. Payment: As per mutually agreed commercial terms.`}
    />
  );
};

export default Quotation;
