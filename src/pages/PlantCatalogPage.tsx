import { Link } from 'react-router-dom';
import { QrCode } from 'lucide-react';
import { usePlantData } from '../context/PlantDataContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ResilientImage } from '../components/ResilientImage';
import { BackButton } from '../components/BackButton';

export function PlantCatalogPage() {
  const { plants } = usePlantData();

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0F1F17]">
      <Navbar variant="solid" />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-[#F6F8F6] border-b border-zinc-200 py-12 sm:py-20">
          <div className="max-w-[1200px] mx-auto px-6 space-y-6">
            <div>
              <BackButton fallbackTo="/" label="Kembali ke Beranda" />
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-[#166534]">
                Katalog Pohon · Aksi Sobat Bumi
              </p>
              <h1 className="text-4xl sm:text-5xl font-semibold leading-tight max-w-3xl text-[#0F1F17]">
                Katalog Jenis Pohon &amp; Panduan Botani
              </h1>
              <p className="text-base text-[#4E6156] max-w-2xl leading-relaxed">
                Pelajari karakteristik, manfaat ekologis, dan panduan perawatan
                dari setiap jenis pohon yang ditanam dalam gerakan Aksi Sobat Bumi.
              </p>
            </div>
          </div>
        </section>

        {/* Plant Species Directory */}
        <section className="py-16 sm:py-24">
          <div className="max-w-[1200px] mx-auto px-6 space-y-12">
            {plants.map((plant) => (
                <article
                  key={plant.id}
                  className="border border-zinc-200 bg-white rounded-2xl overflow-hidden"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                    <div className="lg:col-span-5 min-h-[340px] bg-zinc-100">
                      <ResilientImage
                        src={plant.mainImage}
                        alt={`${plant.plantName} (${plant.scientificName})`}
                        fallbackTitle={plant.plantName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-8">
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#166534]">
                          <span className="font-mono">{plant.plantCode}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#4E6156]">{plant.category}</span>
                        </div>

                        <div>
                          <h2 className="text-3xl sm:text-4xl font-semibold text-[#0F1F17]">
                            {plant.plantName}
                          </h2>
                          <p className="italic text-base text-[#4E6156] mt-1">
                            {plant.scientificName}
                          </p>
                        </div>

                        <p className="text-sm sm:text-base text-[#4E6156] leading-relaxed">
                          {plant.overview}
                        </p>

                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 border-t border-zinc-200 text-sm">
                          <div>
                            <dt className="text-xs font-semibold text-[#4E6156]">
                              Bentuk Daun
                            </dt>
                            <dd className="text-[#0F1F17] mt-1">
                              {plant.characteristics.leafShape}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-[#4E6156]">
                              Habitat Alami
                            </dt>
                            <dd className="text-[#0F1F17] mt-1">
                              {plant.characteristics.habitat}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-[#4E6156]">
                              Cahaya &amp; Air
                            </dt>
                            <dd className="text-[#0F1F17] mt-1">
                              {plant.careGuide.sunlight}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-[#4E6156]">
                              Catatan Pertumbuhan
                            </dt>
                            <dd className="text-[#0F1F17] mt-1">
                              {plant.careGuide.growthNotes}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div className="pt-6 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-4">
                        <span className="text-xs text-[#4E6156]">
                          Punya bibit {plant.plantName}? Buka halaman Anda via
                          QR Cocard.
                        </span>
                        <Link
                          to="/my-plant"
                          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#14532D] text-white hover:bg-[#166534] transition-colors whitespace-nowrap shrink-0"
                        >
                          <QrCode className="w-4 h-4" />
                          Pindai QR Pohonku
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
