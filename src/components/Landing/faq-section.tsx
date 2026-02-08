"use client"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export default function FaqSection() {
    return (
        <section className="py-16 sm:py-24 bg-slate-50">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-headline text-teal-primary mb-4">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-gray-600 max-w-xl mx-auto">
                        Find answers to common questions about our premium eyewear and delivery services.
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
                    <Accordion type="single" collapsible className="w-full">
                        {/* English Section */}
                        <AccordionItem value="item-1" className="border-b-slate-100 last:border-0 border-b">
                            <AccordionTrigger className="text-left text-gray-800 hover:text-teal-primary transition-colors text-lg font-medium">
                                Why choose FocusRobin for your eyewear needs in Lithuania?
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-600 leading-relaxed pt-2 pb-6">
                                <div className="prose prose-sm max-w-none text-gray-600">
                                    <p className="mb-4">
                                        Welcome to <strong>FocusRobin</strong>, Lithuania&apos;s premier online destination for premium
                                        <strong> sunglasses</strong> and <strong>prescription glasses</strong>. We offer a curated
                                        collection of designer eyewear featuring <strong>UV400 protection</strong> and
                                        <strong> polarized lenses</strong> for superior clarity and eye protection.
                                    </p>
                                    <p className="text-xs mt-4 text-gray-400">
                                        Buy FocusRobin sunglasses online | Premium prescription glasses Lithuania |
                                        Best eyewear shop Vilnius | Polarized sunglasses EU delivery |
                                        Designer glasses Kaunas | UV400 sunglasses Klaipėda
                                    </p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2" className="border-b-slate-100 last:border-0 border-b">
                            <AccordionTrigger className="text-left text-gray-800 hover:text-teal-primary transition-colors text-lg font-medium">
                                Where does FocusRobin deliver?
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-600 leading-relaxed pt-2 pb-6">
                                <div className="prose prose-sm max-w-none text-gray-600">
                                    <p>
                                        Whether you&apos;re looking for <strong>sunglasses in Vilnius</strong>, <strong>prescription
                                            glasses in Kaunas</strong>, or <strong>designer eyewear in Klaipėda</strong>, FocusRobin
                                        delivers premium quality directly to your door. Enjoy <strong>fast delivery across Lithuania</strong>
                                        and the entire EU/Schengen area.
                                    </p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* Lithuanian Section */}
                        <AccordionItem value="item-3" className="border-b-slate-100 last:border-0 border-b">
                            <AccordionTrigger className="text-left text-gray-800 hover:text-teal-primary transition-colors text-lg font-medium">
                                Kodėl verta rinktis FocusRobin akinius?
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-600 leading-relaxed pt-2 pb-6">
                                <div className="prose prose-sm max-w-none text-gray-600">
                                    <p className="mb-4">
                                        <strong>FocusRobin</strong> siūlo kokybiškus <strong>saulės akinius</strong> ir
                                        <strong> korekcinius akinius</strong>, suprojektuotus Lietuvoje. Mūsų kolekcijoje rasite
                                        <strong> polarizuotus saulės akinius</strong> su UV apsauga ir stilingus akinius su dioptrijomis,
                                        tinkamus tiek vyrams, tiek moterims.
                                    </p>
                                    <p className="text-xs mt-4 text-gray-400">
                                        Saulės akiniai Vilnius | Korekciniai akiniai Kaunas | Akiniai su dioptrijomis |
                                        Polarizuoti akiniai | Optika internetu | Akiniai vyrams ir moterims |
                                        FocusRobin Lietuva | Pigūs kokybiški akiniai
                                    </p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-4" className="border-b-slate-100 last:border-0">
                            <AccordionTrigger className="text-left text-gray-800 hover:text-teal-primary transition-colors text-lg font-medium">
                                Ar pristatote akinius visoje Lietuvoje?
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-600 leading-relaxed pt-2 pb-6">
                                <div className="prose prose-sm max-w-none text-gray-600">
                                    <p>
                                        Pristatome greitai į <strong>Vilnių</strong>, <strong>Kauną</strong>, <strong>Klaipėdą</strong>,
                                        <strong> Šiaulius</strong>, <strong>Panevėžį</strong> ir visą EU/Schengen zoną.
                                        <strong> Saulės akiniai internetu</strong> ir <strong>korekciniai akiniai internetu</strong> –
                                        patogus būdas rasti stilingus akinius, kurie puikiai tinka jūsų stiliui.
                                    </p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                    </Accordion>
                </div>
            </div>
        </section>
    )
}
