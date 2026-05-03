import './Header.css';

function Header() {
  const date = new Date().toLocaleDateString('fr-FR');
  
  return (
    <header className="header">
      <h1>SenTransport</h1>
      <p>Votre guide du transport en commun à Dakar</p>
      <p>{date}</p>
    </header>
  );
}

export default Header;