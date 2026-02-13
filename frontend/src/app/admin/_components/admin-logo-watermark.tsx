import Image from 'next/image';

export function AdminLogoWatermark() {
  return (
    <div
      aria-hidden
      className='mt-auto flex justify-center pt-12 md:justify-end'
    >
      <Image
        src='/fgs-logo.png'
        alt=''
        width={720}
        height={720}
        className='h-auto w-48 opacity-[0.12] blur-[0.65px] sm:w-64 md:w-80 lg:w-104'
      />
    </div>
  );
}
