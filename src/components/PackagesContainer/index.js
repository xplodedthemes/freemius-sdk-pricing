import React, { Component, Fragment } from 'react';
import FSPricingContext from '../../FSPricingContext';
import { BillingCycleString } from '../../entities/Pricing';
import { PlanManager } from '../../services/PlanManager';
import { Helper } from '../../Helper';
import { Plan } from '../../entities/Plan';
import Package from '../Package';
import Icon from '../Icon';
import Placeholder from '../Placeholder';
import { debounce } from '../../utils/debounce';

import './style.scss';
import Tooltip from '../Tooltip';

class PackagesContainer extends Component {
  static contextType = FSPricingContext;

  slider = null;

  constructor(props) {
    super(props);
  }

  /**
   * @return {string} Returns `Billed Annually`, `Billed Once`, or `Billed Monthly`.
   */
  billingCycleLabel() {
    let label = 'Billed ';

    if (BillingCycleString.ANNUAL === this.context.selectedBillingCycle)
      label += 'Annually';
    else if (BillingCycleString.LIFETIME === this.context.selectedBillingCycle)
      label += 'Once';
    else label += 'Monthly';

    return label;
  }

  /**
   * @param {Object} pricing Pricing entity.
   *
   * @return {string} The price label in this format: `$4.99 / mo` or `$4.99 / year`
   */
  priceLabel(pricing) {
    let pricingData = this.context,
      label = '',
      price = pricing[pricingData.selectedBillingCycle + '_price'];

    label += pricingData.currencySymbols[pricingData.selectedCurrency];
    label += Helper.formatNumber(price);

    if (BillingCycleString.MONTHLY === pricingData.selectedBillingCycle)
      label += ' / mo';
    else if (BillingCycleString.ANNUAL === pricingData.selectedBillingCycle)
      label += ' / year';

    return label;
  }

  componentDidMount() {
    this.slider = (function () {
      let firstVisibleIndex,
        $plansAndPricingSection,
        $track,
        $packages,
        $packagesContainer,
        $nextPackage,
        $prevPackage,
        $packagesMenu,
        $packagesTab,
        defaultNextPrevPreviewWidth,
        cardMinWidth,
        maxMobileScreenWidth,
        cardWidth,
        nextPrevPreviewWidth,
        screenWidth,
        visibleCards,
        mobileSectionOffset;

      let init = function () {
        firstVisibleIndex = 0;
        $plansAndPricingSection = document.querySelector(
          '.fs-section--plans-and-pricing'
        );
        $track = $plansAndPricingSection.querySelector('.fs-section--packages');
        $packages = $track.querySelectorAll('.fs-package');
        $packagesContainer = $track.querySelector('.fs-packages');
        $nextPackage =
          $plansAndPricingSection.querySelector('.fs-next-package');
        $prevPackage =
          $plansAndPricingSection.querySelector('.fs-prev-package');
        $packagesMenu =
          $plansAndPricingSection.querySelector('.fs-packages-menu');
        $packagesTab =
          $plansAndPricingSection.querySelector('.fs-packages-tab');
        defaultNextPrevPreviewWidth = 60;
        cardMinWidth = 315;
        maxMobileScreenWidth = 768;
        mobileSectionOffset = 20;
      };

      const isMobileDevice = function () {
        const sectionComputedStyle = window.getComputedStyle(
            $plansAndPricingSection
          ),
          sectionWidth = parseFloat(sectionComputedStyle.width);

        return sectionWidth < cardMinWidth * 2 - mobileSectionOffset;
      };

      let slide = function (selectedIndex, leftOffset) {
        let leftPos =
          -1 * selectedIndex * cardWidth + (leftOffset ? leftOffset : 0) - 1;

        $packagesContainer.style.left = leftPos + 'px';
      };

      let nextSlide = function () {
        firstVisibleIndex++;

        let leftOffset = 0;

        if (!isMobileDevice() && screenWidth > maxMobileScreenWidth) {
          leftOffset = defaultNextPrevPreviewWidth;

          if (firstVisibleIndex + visibleCards >= $packages.length) {
            $nextPackage.style.visibility = 'hidden';
            $packagesContainer.parentNode.classList.remove('fs-has-next-plan');

            if (firstVisibleIndex - 1 > 0) {
              leftOffset *= 2;
            }
          }

          if (firstVisibleIndex > 0) {
            $prevPackage.style.visibility = 'visible';
            $packagesContainer.parentNode.classList.add('fs-has-previous-plan');
          }
        }

        slide(firstVisibleIndex, leftOffset);
      };

      let prevSlide = function () {
        firstVisibleIndex--;

        let leftOffset = 0;

        if (!isMobileDevice() && screenWidth > maxMobileScreenWidth) {
          if (firstVisibleIndex - 1 < 0) {
            $prevPackage.style.visibility = 'hidden';
            $packagesContainer.parentNode.classList.remove(
              'fs-has-previous-plan'
            );
          }

          if (firstVisibleIndex + visibleCards <= $packages.length) {
            $nextPackage.style.visibility = 'visible';
            $packagesContainer.parentNode.classList.add('fs-has-next-plan');

            if (firstVisibleIndex > 0) {
              leftOffset = defaultNextPrevPreviewWidth;
            }
          }
        }

        slide(firstVisibleIndex, leftOffset);
      };

      let adjustPackages = function () {
        $packagesContainer.parentNode.classList.remove('fs-has-previous-plan');
        $packagesContainer.parentNode.classList.remove('fs-has-next-plan');

        screenWidth = window.outerWidth;

        let sectionComputedStyle = window.getComputedStyle(
            $plansAndPricingSection
          ),
          sectionWidth = parseFloat(sectionComputedStyle.width),
          sectionLeftPos = 0,
          isMobile = screenWidth <= maxMobileScreenWidth || isMobileDevice();

        nextPrevPreviewWidth = defaultNextPrevPreviewWidth;

        if (isMobile) {
          visibleCards = 1;
          cardWidth = sectionWidth;
        } else {
          visibleCards = Math.floor(sectionWidth / cardMinWidth);

          if (visibleCards === $packages.length) {
            nextPrevPreviewWidth = 0;
          } else if (visibleCards < $packages.length) {
            visibleCards = Math.floor(
              (sectionWidth - nextPrevPreviewWidth) / cardMinWidth
            );

            if (visibleCards + 1 < $packages.length) {
              nextPrevPreviewWidth *= 2;
              visibleCards = Math.floor(
                (sectionWidth - nextPrevPreviewWidth) / cardMinWidth
              );
            }
          }

          cardWidth = cardMinWidth;
        }

        $packagesContainer.style.width = cardWidth * $packages.length + 'px';

        sectionWidth =
          visibleCards * cardWidth + (!isMobile ? nextPrevPreviewWidth : 0);

        $packagesContainer.parentNode.style.width = sectionWidth + 'px';

        $packagesContainer.style.left = sectionLeftPos + 'px';

        if (!isMobile && visibleCards < $packages.length) {
          $nextPackage.style.visibility = 'visible';

          /**
           * Center the prev and next buttons on the available space on the left and right sides of the packages collection.
           */
          let packagesContainerParentMargin = parseFloat(
              window.getComputedStyle($packagesContainer.parentNode).marginLeft
            ),
            sectionPadding = parseFloat(sectionComputedStyle.paddingLeft),
            prevButtonRightPos = -sectionPadding,
            nextButtonRightPos = sectionWidth + packagesContainerParentMargin,
            nextPrevWidth = parseFloat(
              window.getComputedStyle($nextPackage).width
            );

          $prevPackage.style.left =
            prevButtonRightPos +
            (sectionPadding + packagesContainerParentMargin - nextPrevWidth) /
              2 +
            'px';
          $nextPackage.style.left =
            nextButtonRightPos +
            (sectionPadding + packagesContainerParentMargin - nextPrevWidth) /
              2 +
            'px';

          $packagesContainer.parentNode.classList.add('fs-has-next-plan');
        } else {
          $prevPackage.style.visibility = 'hidden';
          $nextPackage.style.visibility = 'hidden';
        }

        for (let $package of $packages) {
          $package.style.width = cardWidth + 'px';
        }

        if ($packagesMenu) {
          firstVisibleIndex = $packagesMenu.selectedIndex;
        } else if ($packagesTab) {
          let $tabs = $packagesTab.querySelectorAll('li');

          for (let i = 0; i < $tabs.length; i++) {
            let $tab = $tabs[i];

            if ($tab.classList.contains('fs-package-tab--selected')) {
              firstVisibleIndex = i;
              break;
            }
          }
        }

        if (firstVisibleIndex > 0) {
          firstVisibleIndex--;
          nextSlide();
        }
      };

      init();
      adjustPackages();

      const handlePackagesMenuChange = evt => {
        firstVisibleIndex = evt.target.selectedIndex - 1;
        nextSlide();
      };

      if ($packagesMenu) {
        $packagesMenu.addEventListener('change', handlePackagesMenuChange);
      }

      const debouncedAdjustPackages = debounce(adjustPackages, 250);

      $nextPackage.addEventListener('click', nextSlide);
      $prevPackage.addEventListener('click', prevSlide);
      window.addEventListener('resize', debouncedAdjustPackages);

      return {
        adjustPackages,
        clearEventListeners() {
          $nextPackage.removeEventListener('click', nextSlide);
          $prevPackage.removeEventListener('click', prevSlide);
          window.removeEventListener('resize', debouncedAdjustPackages);
          if ($packagesMenu) {
            $packagesMenu.removeEventListener(
              'change',
              handlePackagesMenuChange
            );
          }
        },
      };
    })();
  }

  componentWillUnmount() {
    this.slider?.clearEventListeners();
  }

  render() {
    let packages = null,
      licenseQuantities =
        this.context.licenseQuantities[this.context.selectedCurrency],
      licenseQuantitiesCount = Object.keys(licenseQuantities).length,
      currentLicenseQuantities = {},
      isSinglePlan = false,
      firstFreePlan = null;

    if (this.context.paidPlansCount > 1 || 1 === licenseQuantitiesCount) {
      // If there are more than one paid plans, create a package component for each plan.
      packages = this.context.plans;
    } else {
      // If there is only one paid plan and it supports multi-license options, create a package component for license quantity.
      packages = [];

      let paidPlan = null;

      for (paidPlan of this.context.plans) {
        if (!firstFreePlan && PlanManager.getInstance().isFreePlan(paidPlan)) {
          firstFreePlan = paidPlan;
        }
        if (PlanManager.getInstance().isHiddenOrFreePlan(paidPlan)) {
          continue;
        }

        break;
      }

      for (let pricing of paidPlan.pricing) {
        if (
          pricing.is_hidden ||
          this.context.selectedCurrency !== pricing.currency ||
          !pricing.supportsBillingCycle(this.context.selectedBillingCycle)
        ) {
          continue;
        }

        let planClone = Object.assign(new Plan(), paidPlan);

        planClone.pricing = [pricing];

        packages.push(planClone);
      }

      isSinglePlan = true;
    }

    let visiblePlanPackages = [],
      maxHighlightedFeaturesCount = 0,
      maxNonHighlightedFeaturesCount = 0,
      prevNonHighlightedFeatures = {},
      maxPlanDescriptionLinesCount = 0,
      prevPlanPackage = null,
      installPlanLicensesCount = 0;

    for (let planPackage of packages) {
      if (planPackage.is_hidden) {
        continue;
      }

      let isFreePlan = PlanManager.getInstance().isFreePlan(
        planPackage.pricing
      );

      if (isFreePlan) {
        if (this.context.paidPlansCount >= 3) {
          continue;
        }

        planPackage.is_free_plan = isFreePlan;
      } else {
        planPackage.pricingCollection = {};

        planPackage.pricing.map(pricing => {
          let licenses = pricing.getLicenses();

          if (
            pricing.is_hidden ||
            this.context.selectedCurrency !== pricing.currency
          ) {
            return;
          }

          if (
            !pricing.supportsBillingCycle(this.context.selectedBillingCycle)
          ) {
            return;
          }

          planPackage.pricingCollection[licenses] = pricing;

          if (
            isSinglePlan ||
            this.context.selectedLicenseQuantity == licenses
          ) {
            planPackage.selectedPricing = pricing;
          }

          if (
            this.context.license &&
            this.context.license.pricing_id == pricing.id
          ) {
            installPlanLicensesCount = pricing.licenses;
          }
        });

        let pricingLicenses = Object.keys(planPackage.pricingCollection);

        if (0 === pricingLicenses.length) {
          continue;
        }

        planPackage.pricingLicenses = pricingLicenses;
      }

      planPackage.highlighted_features = [];
      planPackage.nonhighlighted_features = [];

      if (null !== prevPlanPackage) {
        planPackage.nonhighlighted_features.push({
          id: `all_plan_${prevPlanPackage.id}_features`,
          title: `All ${prevPlanPackage.title} Features`,
        });
      }

      if (planPackage.hasSuccessManagerSupport()) {
        planPackage.nonhighlighted_features.push({
          id: `plan_${planPackage.id}_personal_success_manager`,
          title: 'Personal Success Manager',
        });
      }

      if (!Helper.isNonEmptyString(planPackage.description)) {
        planPackage.description_lines = [];
      } else {
        planPackage.description_lines = planPackage.description
          .split('\n')
          .map((item, key) => {
            return (
              <Fragment key={key}>
                {item}
                <br />
              </Fragment>
            );
          });
      }

      maxPlanDescriptionLinesCount = Math.max(
        maxPlanDescriptionLinesCount,
        planPackage.description_lines.length
      );

      visiblePlanPackages.push(planPackage);

      if (Helper.isUndefinedOrNull(planPackage.features)) {
        continue;
      }

      for (let feature of planPackage.features) {
        if (!feature.is_featured) {
          continue;
        }

        if (
          Helper.isNonEmptyString(feature.value) ||
          Helper.isNumeric(feature.value)
        ) {
          planPackage.highlighted_features.push(feature);
        } else if (
          isSinglePlan ||
          Helper.isUndefinedOrNull(
            prevNonHighlightedFeatures[`f_${feature.id}`]
          )
        ) {
          planPackage.nonhighlighted_features.push(feature);

          prevNonHighlightedFeatures[`f_${feature.id}`] = true;
        }
      }

      maxHighlightedFeaturesCount = Math.max(
        maxHighlightedFeaturesCount,
        planPackage.highlighted_features.length
      );
      maxNonHighlightedFeaturesCount = Math.max(
        maxNonHighlightedFeaturesCount,
        planPackage.nonhighlighted_features.length
      );

      if (!isFreePlan) {
        for (let pricing of planPackage.pricing) {
          if (
            pricing.is_hidden ||
            this.context.selectedCurrency !== pricing.currency ||
            !pricing.supportsBillingCycle(this.context.selectedBillingCycle)
          ) {
            continue;
          }

          currentLicenseQuantities[pricing.getLicenses()] = true;
        }
      }

      if (!isSinglePlan) {
        prevPlanPackage = planPackage;
      }
    }

    let packageComponents = [],
      isFirstPlanPackage = true,
      firstPlan = null,
      hasFeaturedPlan = false,
      mobileTabs = [],
      mobileDropdownOptions = [],
      selectedPlanOrPricingID = this.context.selectedPlanID,
      packageIndex = 0,
      $packages = document.querySelector('.fs-packages');

    for (let visiblePlanPackage of visiblePlanPackages) {
      if (isFirstPlanPackage) {
        firstPlan = visiblePlanPackage;
      }

      if (
        visiblePlanPackage.highlighted_features.length <
        maxHighlightedFeaturesCount
      ) {
        const total =
          maxHighlightedFeaturesCount -
          visiblePlanPackage.highlighted_features.length;

        for (let i = 0; i < total; i++) {
          visiblePlanPackage.highlighted_features.push({ id: `filler_${i}` });
        }
      }

      if (
        visiblePlanPackage.nonhighlighted_features.length <
        maxNonHighlightedFeaturesCount
      ) {
        const total =
          maxNonHighlightedFeaturesCount -
          visiblePlanPackage.nonhighlighted_features.length;

        for (let i = 0; i < total; i++) {
          visiblePlanPackage.nonhighlighted_features.push({
            id: `filler_${i}`,
          });
        }
      }

      if (
        visiblePlanPackage.description_lines.length <
        maxPlanDescriptionLinesCount
      ) {
        const total =
          maxPlanDescriptionLinesCount -
          visiblePlanPackage.description_lines.length;

        for (let i = 0; i < total; i++) {
          visiblePlanPackage.description_lines.push(
            <Placeholder key={`filler_${i}`}></Placeholder>
          );
        }
      }

      if (
        visiblePlanPackage.is_featured &&
        !isSinglePlan &&
        this.context.paidPlansCount > 1
      ) {
        hasFeaturedPlan = true;
      }

      const visiblePlanOrPricingID = isSinglePlan
        ? visiblePlanPackage.pricing[0].id
        : visiblePlanPackage.id;

      if (!selectedPlanOrPricingID && isFirstPlanPackage) {
        selectedPlanOrPricingID = visiblePlanOrPricingID;
      }

      mobileTabs.push(
        <li
          key={visiblePlanOrPricingID}
          className={
            'fs-package-tab' +
            (visiblePlanOrPricingID == selectedPlanOrPricingID
              ? ' fs-package-tab--selected'
              : '')
          }
          data-index={packageIndex}
          data-plan-id={visiblePlanOrPricingID}
          onClick={event => {
            this.props.changePlanHandler(event);

            if (!$packages) {
              $packages = document.querySelector('.fs-packages');
            }
            let packageIndex = parseInt(
              event.target.parentNode.getAttribute('data-index')
            );
            let $section = $packages.querySelector(
              '.fs-package:nth-child(' + (packageIndex + 1) + ')'
            );
            let sectionWidth = parseFloat(
              window.getComputedStyle($section).width
            );
            let leftPos = -1 * packageIndex * sectionWidth - 1;

            $packages.style.left = leftPos + 'px';
          }}
        >
          <a href="#">
            {isSinglePlan
              ? visiblePlanPackage.pricing[0].sitesLabel()
              : visiblePlanPackage.title}
          </a>
        </li>
      );

      mobileDropdownOptions.push(
        <option
          key={visiblePlanOrPricingID}
          className="fs-package-option"
          id={`fs_package_${visiblePlanOrPricingID}_option`}
          value={visiblePlanOrPricingID}
        >
          {(visiblePlanOrPricingID == selectedPlanOrPricingID ||
          !selectedPlanOrPricingID
            ? 'Selected Plan: '
            : '') + visiblePlanPackage.title}
        </option>
      );

      packageComponents.push(
        <Package
          key={visiblePlanOrPricingID}
          isFirstPlanPackage={isFirstPlanPackage}
          installPlanLicensesCount={installPlanLicensesCount}
          isSinglePlan={isSinglePlan}
          maxHighlightedFeaturesCount={maxHighlightedFeaturesCount}
          maxNonHighlightedFeaturesCount={maxNonHighlightedFeaturesCount}
          licenseQuantities={licenseQuantities}
          currentLicenseQuantities={currentLicenseQuantities}
          planPackage={visiblePlanPackage}
          changeLicensesHandler={this.props.changeLicensesHandler}
          upgradeHandler={this.props.upgradeHandler}
        />
      );

      if (isFirstPlanPackage) {
        isFirstPlanPackage = false;
      }

      packageIndex++;
    }

    return (
      <Fragment>
        <section className="fs-section--packages-wrap">
          <nav className="fs-prev-package">
            <Icon icon={['fas', 'chevron-left']} />
          </nav>
          <section
            className={
              'fs-packages-nav' +
              (hasFeaturedPlan ? ' fs-has-featured-plan' : '')
            }
          >
            {packageComponents.length > 3 && (
              <select
                className="fs-packages-menu"
                onChange={this.props.changePlanHandler}
                value={selectedPlanOrPricingID}
              >
                {mobileDropdownOptions}
              </select>
            )}
            {packageComponents.length <= 3 && (
              <ul className="fs-packages-tab">{mobileTabs}</ul>
            )}
            <ul className="fs-packages">{packageComponents}</ul>
          </section>
          <nav className="fs-next-package">
            <Icon icon={['fas', 'chevron-right']} />
          </nav>
        </section>
        {isSinglePlan && (
          <section className="fs-section fs-packages-nav fs-package-merged-features">
            <h1>Features</h1>
            <div className="fs-package-merged">
              <ul className="fs-plan-features">
                {firstPlan.nonhighlighted_features.map(feature => {
                  if (!Helper.isNonEmptyString(feature.title)) {
                    return (
                      <li key={feature.id}>
                        <Placeholder />
                      </li>
                    );
                  }

                  const isBold = feature.title.search(/\*/) !== -1;
                  const isPremiumOnly =
                    firstFreePlan &&
                    !firstFreePlan.features.find(
                      freeFeature => freeFeature.id === feature.id
                    );

                  const featureTitle =
                    0 === feature.id.indexOf('all_plan_') || isBold ? (
                      <strong>{feature.title.replace('*', '')}</strong>
                    ) : (
                      feature.title
                    );

                  const isSubFeature = feature.title.search('--') !== -1;

                  const PremiumBadge = () => {
                    return (
                      <span className="fs-feature-pro">
                        <img
                          width="24"
                          src="data:image/png;base64,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"
                        />
                      </span>
                    );
                  };

                  return (
                    <li
                      key={feature.id}
                      className={(
                        (isBold ? 'featured ' : '') +
                        (isSubFeature ? ' sub' : '')
                      ).trim()}
                    >
                      {!isSubFeature && <Icon icon={['fas', 'check']} />}
                      {isSubFeature && <span>&nbsp;&nbsp;</span>}
                      <span className="fs-feature-title">
                        <span>{featureTitle}</span>
                      </span>
                      {Helper.isNonEmptyString(feature.description) && (
                        <Tooltip>
                          <Fragment>{feature.description}</Fragment>
                        </Tooltip>
                      )}
                      {isPremiumOnly && (
                        <Tooltip IconComponent={PremiumBadge}>
                          <Fragment>
                            This is a premium feature, unavailable within the
                            free version
                          </Fragment>
                        </Tooltip>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}
      </Fragment>
    );
  }
}

export default PackagesContainer;
