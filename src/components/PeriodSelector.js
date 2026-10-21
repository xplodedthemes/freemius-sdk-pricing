import React, { Component } from 'react';
import FSPricingContext from '../FSPricingContext';
import { Helper } from '../Helper';
import { BillingCycleString } from '../entities/Pricing';

/**
 * @author Leo Fajardo
 */
class PeriodSelector extends Component {
  static contextType = FSPricingContext;

  constructor(props) {
    super(props);
  }

  /**
   * @param {string} billingCycle
   *
   * @return {number} The savings percentage advertised for the billing cycle: annual compared to monthly, lifetime compared to 5 years of annual.
   */
  discount(billingCycle) {
    if (BillingCycleString.ANNUAL === billingCycle) {
      return this.context.annualDiscount;
    }

    if (BillingCycleString.LIFETIME === billingCycle) {
      return this.context.lifetimeDiscount;
    }

    return 0;
  }

  discountTitle(billingCycle) {
    return BillingCycleString.ANNUAL === billingCycle
      ? 'Compared to paying monthly for a year'
      : 'Compared to paying annually for 5 years';
  }

  render() {
    return (
      <ul className="fs-billing-cycles">
        {this.context.billingCycles.map(billingCycle => {
          let label =
              BillingCycleString.ANNUAL === billingCycle
                ? 'Annually'
                : Helper.ucfirst(billingCycle),
            discount = this.discount(billingCycle);

          return (
            <li
              className={
                `fs-period--${billingCycle}` +
                (this.context.selectedBillingCycle === billingCycle
                  ? ' fs-selected-billing-cycle'
                  : '')
              }
              key={billingCycle}
              data-billing-cycle={billingCycle}
              onClick={this.props.handler}
            >
              {label}
              {discount > 0 && (
                <span
                  className="fs-billing-cycle-discount"
                  title={this.discountTitle(billingCycle)}
                >
                  Save {discount}%
                </span>
              )}
            </li>
          );
        })}
      </ul>
    );
  }
}

export default PeriodSelector;
