const NINEA = "013038395";
const RCCM = "SN DKR 2026 A 16899";
const DUNS = "669805885";

const linkStyle: React.CSSProperties = {
  color: "#00c8ff",
  textDecoration: "underline",
  textUnderlineOffset: 2,
};

export default function LegalIds({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={className} style={style}>
      NINEA :{" "}
      <a
        href="https://e-senegal.sn/#/recherche-ninea?query=013038395"
        target="_blank"
        rel="noopener noreferrer"
        style={linkStyle}
        title="Vérifier sur E-Sénégal"
      >
        {NINEA}
      </a>
      {" | "}
      RCCM :{" "}
      <a
        href="https://e-senegal.sn/#/recherche-ninea?query=013038395"
        target="_blank"
        rel="noopener noreferrer"
        style={linkStyle}
        title="Vérifier sur E-Sénégal"
      >
        {RCCM}
      </a>
      {" | "}
      D-U-N-S :{" "}
      <a
        href="https://www.verif.com/searchResult/?search=669805885&country=SN"
        target="_blank"
        rel="noopener noreferrer"
        style={linkStyle}
        title="Vérifier n’importe quelle entreprise dans le monde"
      >
        {DUNS}
      </a>
    </span>
  );
}
