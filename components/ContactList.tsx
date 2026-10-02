import { MessageCircle, Phone, UserRound } from "lucide-react";

const contacts = [
  { name: "Boby Yadav", phone: "7974326148" },
  { name: "Boby Verma", phone: "8770706190" }
];

export function ContactList() {
  return (
    <div className="contacts">
      {contacts.map((contact) => (
        <div className="contact-row" key={contact.phone}>
          <div>
            <div className="contact-name"><UserRound size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6, color: "#f4c84b" }} />{contact.name}</div>
            <div className="contact-number">+91 {contact.phone.slice(0, 5)} {contact.phone.slice(5)}</div>
          </div>
          <div className="contact-actions">
            <a className="icon-button" href={`tel:+91${contact.phone}`} aria-label={`Call ${contact.name}`} title={`Call ${contact.name}`}><Phone size={16} /></a>
            <a className="icon-button" href={`https://wa.me/91${contact.phone}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${contact.name}`} title={`WhatsApp ${contact.name}`}><MessageCircle size={17} /></a>
          </div>
        </div>
      ))}
    </div>
  );
}
