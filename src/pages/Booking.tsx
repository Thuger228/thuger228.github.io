import SEO from '@/components/SEO';
import BookingForm from '@/components/BookingForm';
import PageContent, { PageHeader } from '@/components/PageContent';
import { useBookingCopy } from '@/i18n/content/booking';

const Booking = () => {
  const { page } = useBookingCopy();

  return (
    <div className="min-h-screen pt-16 md:pt-20">
      <SEO title={page.title} description={page.desc} page="booking" />
      <section className="pt-12 md:pt-20">
        <div className="container mx-auto px-6">
          <PageHeader page={page} />
          <div className="max-w-3xl mx-auto">
            <BookingForm />
          </div>
        </div>
      </section>
      <PageContent page={page} />
    </div>
  );
};

export default Booking;
