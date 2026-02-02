import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Datenschutzerklärung",
    description: "Datenschutzerklärung und Informationen zum Datenschutz",
    robots: {
        index: false,
        follow: true,
    },
};

export default function DatenschutzPage() {
    return (
        <div className="article">
            <div className="container">
                <header className="article__header">
                    <h1>Datenschutzerklärung</h1>
                </header>

                <div className="article__content">
                    <h2>1. Datenschutz auf einen Blick</h2>

                    <h3>Allgemeine Hinweise</h3>
                    <p>
                        Die folgenden Hinweise geben einen einfachen Überblick darüber, was
                        mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website
                        besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie
                        persönlich identifiziert werden können.
                    </p>

                    <h3>Datenerfassung auf dieser Website</h3>
                    <p>
                        <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong>
                        <br />
                        Die Datenverarbeitung auf dieser Website erfolgt durch den
                        Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum
                        dieser Website entnehmen.
                    </p>

                    <h3>Wie erfassen wir Ihre Daten?</h3>
                    <p>
                        Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese
                        mitteilen. Hierbei kann es sich z.B. um Daten handeln, die Sie in
                        ein Kontaktformular eingeben.
                    </p>
                    <p>
                        Andere Daten werden automatisch oder nach Ihrer Einwilligung beim
                        Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor
                        allem technische Daten (z.B. Internetbrowser, Betriebssystem oder
                        Uhrzeit des Seitenaufrufs).
                    </p>

                    <h3>Wofür nutzen wir Ihre Daten?</h3>
                    <p>
                        Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung
                        der Website zu gewährleisten. Andere Daten können zur Analyse Ihres
                        Nutzerverhaltens verwendet werden.
                    </p>

                    <h3>Welche Rechte haben Sie bezüglich Ihrer Daten?</h3>
                    <p>
                        Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft,
                        Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu
                        erhalten. Sie haben außerdem ein Recht, die Berichtigung oder
                        Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur
                        Datenverarbeitung erteilt haben, können Sie diese Einwilligung
                        jederzeit für die Zukunft widerrufen.
                    </p>

                    <h2>2. Hosting</h2>
                    <p>
                        Wir hosten die Inhalte unserer Website bei folgendem Anbieter:
                        [HOSTING-ANBIETER]
                    </p>

                    <h2>3. Allgemeine Hinweise und Pflichtinformationen</h2>

                    <h3>Datenschutz</h3>
                    <p>
                        Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen
                        Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten
                        vertraulich und entsprechend den gesetzlichen
                        Datenschutzvorschriften sowie dieser Datenschutzerklärung.
                    </p>

                    <h3>Hinweis zur verantwortlichen Stelle</h3>
                    <p>
                        Die verantwortliche Stelle für die Datenverarbeitung auf dieser
                        Website ist:
                    </p>
                    <p>
                        FLOWTUNER
                        <br />
                        [STRASSE]
                        <br />
                        [PLZ] [STADT]
                        <br />
                        <br />
                        Telefon: [TELEFON]
                        <br />
                        E-Mail: [EMAIL]
                    </p>

                    <h3>Speicherdauer</h3>
                    <p>
                        Soweit innerhalb dieser Datenschutzerklärung keine speziellere
                        Speicherdauer genannt wurde, verbleiben Ihre personenbezogenen Daten
                        bei uns, bis der Zweck für die Datenverarbeitung entfällt.
                    </p>

                    <h3>Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
                    <p>
                        Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen
                        Einwilligung möglich. Sie können eine bereits erteilte Einwilligung
                        jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf
                        erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.
                    </p>

                    <h3>Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>
                    <p>
                        Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein
                        Beschwerderecht bei einer Aufsichtsbehörde zu, insbesondere in dem
                        Mitgliedstaat ihres gewöhnlichen Aufenthalts, ihres Arbeitsplatzes
                        oder des Orts des mutmaßlichen Verstoßes.
                    </p>

                    <h2>4. Datenerfassung auf dieser Website</h2>

                    <h3>Server-Log-Dateien</h3>
                    <p>
                        Der Provider der Seiten erhebt und speichert automatisch
                        Informationen in so genannten Server-Log-Dateien, die Ihr Browser
                        automatisch an uns übermittelt. Dies sind:
                    </p>
                    <ul>
                        <li>Browsertyp und Browserversion</li>
                        <li>verwendetes Betriebssystem</li>
                        <li>Referrer URL</li>
                        <li>Hostname des zugreifenden Rechners</li>
                        <li>Uhrzeit der Serveranfrage</li>
                        <li>IP-Adresse</li>
                    </ul>
                    <p>
                        Eine Zusammenführung dieser Daten mit anderen Datenquellen wird
                        nicht vorgenommen.
                    </p>

                    <h3>Anfrage per E-Mail oder Telefon</h3>
                    <p>
                        Wenn Sie uns per E-Mail oder Telefon kontaktieren, wird Ihre Anfrage
                        inklusive aller daraus hervorgehenden personenbezogenen Daten
                        (Name, Anfrage) zum Zwecke der Bearbeitung Ihres Anliegens bei uns
                        gespeichert und verarbeitet.
                    </p>

                    <h2>5. Terminbuchung (Calendly)</h2>
                    <p>
                        Für die Buchung von Terminen nutzen wir den Dienst Calendly. Wenn
                        Sie einen Termin buchen, werden Ihre eingegebenen Daten (Name,
                        E-Mail-Adresse, ggf. Telefonnummer) an Calendly übermittelt und dort
                        gespeichert.
                    </p>
                    <p>
                        Anbieter ist Calendly LLC, 271 17th St NW, Ste 1000, Atlanta, GA
                        30363, USA. Weitere Informationen zum Datenschutz bei Calendly
                        finden Sie unter:{" "}
                        <a
                            href="https://calendly.com/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            https://calendly.com/privacy
                        </a>
                    </p>

                    <h2>6. SSL- bzw. TLS-Verschlüsselung</h2>
                    <p>
                        Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der
                        Übertragung vertraulicher Inhalte eine SSL- bzw.
                        TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie
                        daran, dass die Adresszeile des Browsers von „http://" auf
                        „https://" wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.
                    </p>

                    <p style={{ marginTop: "3rem", color: "var(--color-text-secondary)" }}>
                        Stand: [DATUM]
                    </p>
                </div>
            </div>
        </div>
    );
}
