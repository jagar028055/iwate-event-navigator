
import React from 'react';

interface MapPinIconProps {
  className?: string;
}

export const MapPinIcon: React.FC<MapPinIconProps> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M11.54 22.35a.75.75 0 01-1.08 0l-6.75-6.75a.75.75 0 01.02-1.06l6.75-6.75a.75.75 0 111.06 1.06l-5.47 5.47a.75.75 0 000 1.06l5.47 5.47a.75.75 0 010 1.06z"
        clipRule="evenodd"
        transform="translate(-5.5, -5.5) scale(1.5)"
      />
      <path
        fillRule="evenodd"
        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
        clipRule="evenodd"
        transform="translate(-2, 0) scale(0.65) translate(8, 1)"
      />
      <path d="M12 21.75c-1.89 0-3.62-.76-4.88-2.02A6.953 6.953 0 015.25 12c0-1.89.76-3.62 2.02-4.88A6.953 6.953 0 0112 5.25c1.89 0 3.62.76 4.88 2.02A6.953 6.953 0 0118.75 12c0 1.89-.76 3.62-2.02 4.88A6.953 6.953 0 0112 21.75z" opacity="0"></path>
      <path d="M12,1.5C7.3,1.5,3.5,5.3,3.5,10c0,4.7,3.8,8.5,8.5,8.5s8.5-3.8,8.5-8.5C20.5,5.3,16.7,1.5,12,1.5z M12,15.5 c-3,0-5.5-2.5-5.5-5.5S9,4.5,12,4.5s5.5,2.5,5.5,5.5S15,15.5,12,15.5z"></path>
      <path d="M12,8.5c-0.8,0-1.5,0.7-1.5,1.5s0.7,1.5,1.5,1.5s1.5-0.7,1.5-1.5S12.8,8.5,12,8.5z"></path>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" transform="translate(0, 1)"/>
    </svg>
  );
};
