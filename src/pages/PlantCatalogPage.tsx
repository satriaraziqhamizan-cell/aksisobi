import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  getAllPlants,
  getAllPublishedJourneys,
} from '../services/plantJourneyService';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ResilientImage } from '../components/ResilientImage';
import { BackButton } from '../components/BackButton';

export function PlantCatalogPage() {
  const plants = getAllPlants();
  const journeys = getAllPublishedJourneys();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F4] text-[#14271B]">
      <Navbar variant="solid" />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-[#F4F0E4] border-b border-[#14271B]/10 py-12 sm:py-20">
          <div className="max-w-[1200px] mx-auto px-6 space-y-6">
            <div>
              <BackButton fallbackTo="/" label="Kembali ke Beranda" />
            </div>
            <div className="space-y-4">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#647C45]">
                Plant Catalog · Aksi Sobat Bumi
              </p>
              <h1 className="font-editorial text-4xl sm:text-5xl font-medium leading-tight max-w-3xl">
                Katalog Jenis Pohon &amp; Panduan Botani
              </h1>
              <p className="text-base text-[#14271B]/80 max-w-2xl leading-relaxed">
                Pelajari karakteristik, manfaat ekologis, dan panduan perawatan
                dari setiap jenis pohon yang ditanam dalam gerakan Aksi Sobat Bumi.
              </p>
            </div>
          </div>
        </section>

        {/* Plant Species Directory */}
        <section className="py-16 sm:py-24">
          <div className="max-w-[1200px] mx-auto px-6 space-y-16">
            {plants.map((plant, idx) => {
              const linkedJourney = journeys.find(
                (j) => j.plant.id === plant.id
              );

              return (
                <article
                  key={plant.id}
                  className="border border-[#14271B]/12 bg-white rounded-xl overflow-hidden"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                    <div className="lg:col-span-5 min-h-[340px] bg-[#F4F0E4]">
                      <ResilientImage
                        src={plant.mainImage}
                        alt={`${plant.plantName} (${plant.scientificName})`}
                        fallbackTitle={plant.plantName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-8">
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#647C45]">
                          <span>0{idx + 1}.</span>
                          <span>{plant.plantCode}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-sans">{plant.category}</span>
                        </div>

                        <div>
                          <h2 className="font-editorial text-3xl sm:text-4xl font-medium text-[#14271B]">
                            {plant.plantName}
                          </h2>
                          <p className="font-serif italic text-base text-[#14271B]/70 mt-1">
                            {plant.scientificName}
                          </p>
                        </div>

                        <p className="text-sm sm:text-base text-[#14271B]/80 leading-relaxed">
                          {plant.overview}
                        </p>

                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#14271B]/10 text-sm">
                          <div>
                            <dt className="text-xs font-mono uppercase tracking-wider text-[#14271B]/55">
                              Bentuk Daun
                            </dt>
                            <dd className="text-[#14271B]/85 mt-1">
                              {plant.characteristics.leafShape}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-mono uppercase tracking-wider text-[#14271B]/55">
                              Habitat Alami
                            </dt>
                            <dd className="text-[#14271B]/85 mt-1">
                              {plant.characteristics.habitat}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-mono uppercase tracking-wider text-[#14271B]/55">
                              Cahaya &amp; Air
                            </dt>
                            <dd className="text-[#14271B]/85 mt-1">
                              {plant.careGuide.sunlight}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-mono uppercase tracking-wider text-[#14271B]/55">
                              Catatan Pertumbuhan
                            </dt>
                            <dd className="text-[#14271B]/85 mt-1">
                              {plant.careGuide.growthNotes}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {linkedJourney && (
                        <div className="pt-6 border-t border-[#14271B]/10 flex flex-wrap items-center justify-between gap-4">
                          <div className="text-xs text-[#14271B]/70">
                            <span className="font-mono font-semibold text-[#14271B]">
                              {linkedJourney.record.plantIdCode}
                            </span>{' '}
                            · Penanam: {linkedJourney.participant.fullName}
                          </div>
                          <Link
                            to={`/plant/${linkedJourney.record.plantIdCode}`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-md bg-[#14271B] text-[#FAF9F4] hover:bg-[#284B34] transition-colors whitespace-nowrap shrink-0"
                          >
                            Buka Plant Journey {plant.plantName}
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
