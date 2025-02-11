import React from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

const SocialMedia = () => {
  const { t } = useTranslation();

  return (
    <React.Fragment>
      <NavLink
        to="https://github.com/opensignlabs/opensign"
        target="_blank"
        rel="noopener noreferrer"
      >
        <i aria-hidden="true" className="fa-brands fa-github"></i>
        <span className="fa-sr-only">
          OpenSign&apos;s {t("social-media.github")}
        </span>
      </NavLink>
      <NavLink
        to="https://www.linkedin.com/company/excis-compliance"
        target="_blank"
        rel="noopener noreferrer"
      >
        <i aria-hidden="true" className="fa-brands fa-linkedin"></i>
        <span className="fa-sr-only">
          OpenSign&apos;s {t("social-media.linked-in")}
        </span>
      </NavLink>
      <NavLink
        to="https://twitter.com/excisl"
        target="_blank"
        rel="noopener noreferrer"
      >
        <i aria-hidden="true" className="fa-brands fa-square-x-twitter"></i>
        <span className="fa-sr-only">
          OpenSign&apos;s {t("social-media.twitter")}
        </span>
      </NavLink>
      <NavLink
        to="https://discord.com/invite/xe9TDuyAyj"
        target="_blank"
        rel="noopener noreferrer"
      >
        <i aria-hidden="true" className="fa-brands fa-discord"></i>
        <span className="fa-sr-only">
          OpenSign&apos;s {t("social-media.discord")}
        </span>
      </NavLink>
    </React.Fragment>
  );
};

export default SocialMedia;
