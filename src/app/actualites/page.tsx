import Container from "@/components/Container";
import Button from "@/components/Button";
import InstagramEmbeds from "@/components/InstagramEmbeds";
import FacebookFeedClient from "@/components/FacebookFeedClient";

const FACEBOOK_PAGE_URL = "https://www.facebook.com/CSViriat.football";
const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/cs_viriat/";

const instagramPosts = [
  {
    url: "https://www.instagram.com/p/DUnEgyOCBIn/",
    label: "Affiche / annonce",
  },
  {
    url: "https://www.instagram.com/p/DUkZGeVCOEm/",
    label: "Résultat / retour match",
  },
];

export default function ActualitesPage() {
  return (
    <Container>
      <div className="py-14">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900">
          Actualités
        </h1>
        <p className="mt-3 max-w-2xl text-neutral-700 leading-relaxed">
          Retrouvez ici les dernières informations du club. Les publications
          officielles sont relayées sur Facebook et Instagram.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={FACEBOOK_PAGE_URL}>Facebook</Button>
          <Button href={INSTAGRAM_PROFILE_URL} variant="ghost">
            Instagram (@cs_viriat)
          </Button>
        </div>

        {/* Facebook feed */}
        <section className="mt-12">
          <h2 className="text-xl font-extrabold text-neutral-900">
            Facebook — publications
          </h2>
          <p className="mt-2 text-sm text-neutral-700">
            Flux officiel de la page Facebook.
          </p>

          <div className="mt-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <FacebookFeedClient pageUrl={FACEBOOK_PAGE_URL} />
          </div>
        </section>

        {/* Instagram embeds */}
        <section className="mt-12">
          <h2 className="text-xl font-extrabold text-neutral-900">
            Instagram — à la une
          </h2>
          <p className="mt-2 text-sm text-neutral-700">
            Sélection de posts (affiches, résultats, événements). On peut en
            ajouter/supprimer en 10 secondes.
          </p>

          <div className="mt-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <InstagramEmbeds posts={instagramPosts} />
          </div>
        </section>
      </div>
    </Container>
  );
}
