import type { SocialObjects } from "./types";

export const SITE = {
  website: "https://astro-paper.pages.dev/",
  author: "Bentegar Sid Ahmed Abdelillah",
  desc: "My personal blog",
  title: "Abdou BENTEGAR",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerPage: 3,
};

export const LOGO_IMAGE = {
  enable: false,
  svg: true,
  width: 216,
  height: 46,
};

export const SOCIALS: SocialObjects = [
  {
    name: "Github",
    href: "https://github.com/sidahmedabdelillah",
    linkTitle: ` Abdou BENTEGAR on Github`,
    active: true,
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/abdou12panda/",
    linkTitle: `Abdou BENTEGAR on Facebook`,
    active: true,
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/abdou_bentegar/",
    linkTitle: `Abdou BENTEGAR on Instagram`,
    active: true,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/sid-ahmed-abdelillah-bentegar-0556a1173/",
    linkTitle: `Abdou BENTEGAR on LinkedIn`,
    active: true,
  },
  {
    name: "Mail",
    href: "mailto:abdoubentegar@gmail.com",
    linkTitle: `Send an email to Abdou BENTEGAR`,
    active: false,
  },
  {
    name: "Twitter",
    href: "https://twitter.com/panda_AB12",
    linkTitle: `Abdou BENTEGAR on Twitter`,
    active: false,
  },
];
