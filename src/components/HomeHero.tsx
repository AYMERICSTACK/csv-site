import Image from "next/image";
import Link from "next/link";
import Container from "@/components/Container";
import Button from "@/components/Button";
import { site } from "@/data/site";
import styles from "./HomeHero.module.css";

const quick = [
  {
    title: "Inscriptions",
    text: "Tarifs, dossier et contacts centralisés.",
    href: "/inscriptions",
  },
  {
    title: "Équipes & horaires",
    text: "Créneaux par catégorie, clair et à jour.",
    href: "/equipes",
  },
  {
    title: "Calendrier",
    text: "Tournois, stages, AG et événements du club.",
    href: "/calendrier",
  },
];

const values = [
  { k: "Encadrement", v: "structuré" },
  { k: "Formation", v: "jeunes" },
  { k: "Ambiance", v: "familiale" },
];

export default function HomeHero() {
  return (
    <section className={styles.hero}>
      <div className={styles.background}>
        <Image
          src="/hero-csv.png"
          alt="Visuel principal CS Viriat"
          fill
          priority
          className={styles.backgroundImage}
        />
      </div>

      <div className={styles.overlay} />
      <div className={styles.gradient} />

      <div className={styles.decor}>
        <div className={styles.decorOrange} />
        <div className={styles.decorDark} />
      </div>

      <Container>
        <div className={styles.inner}>
          <div className={styles.left}>
            <div className={styles.badge}>
              <span className={styles.badgeDot} />
              Site officiel — CS Viriat (CSV)
            </div>

            <h1 className={styles.title}>{site.name}</h1>

            <p className={styles.subtitle}>{site.slogan}</p>

            <div className={styles.actions}>
              <Button href="/inscriptions">S’inscrire</Button>

              <Link href="/club" className={styles.secondaryButton}>
                Découvrir le club
              </Link>
            </div>

            <div className={styles.valueGrid}>
              {values.map((item) => (
                <div key={item.k} className={styles.valueCard}>
                  <div className={styles.valueLabel}>{item.k}</div>
                  <div className={styles.valueValue}>{item.v}</div>
                </div>
              ))}
            </div>
          </div>

          <aside className={styles.panel} aria-label="Accès rapide">
            <div className={styles.panelHeader}>
              <div>
                <div className={styles.panelTitle}>Accès rapide</div>
                <div className={styles.panelSubtitle}>
                  Les liens essentiels du club
                </div>
              </div>

              <div className={styles.season}>Saison 2026</div>
            </div>

            <div className={styles.quickList}>
              {quick.map((q) => (
                <Link
                  key={q.title}
                  href={q.href}
                  className={styles.quickCard}
                  aria-label={`${q.title} — ${q.text}`}
                >
                  <div className={styles.quickCardContent}>
                    <div className={styles.quickTitle}>{q.title}</div>
                    <div className={styles.quickText}>{q.text}</div>
                  </div>

                  <div className={styles.quickArrow} aria-hidden="true">
                    →
                  </div>
                </Link>
              ))}
            </div>

            <div className={styles.panelActions}>
              <Button href="/contact">Nous contacter</Button>
              <Button href="/calendrier" variant="ghost">
                Voir le calendrier
              </Button>
            </div>
          </aside>
        </div>
      </Container>

      <div className={styles.bottomFade} />
    </section>
  );
}
