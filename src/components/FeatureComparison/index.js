import React, { Fragment, useState } from 'react';
import Icon from '../Icon';

import './style.scss';

/**
 * Every feature, plan by plan: a row per feature with a check, a dash or the plan's value. Freemius features
 * whose title starts with "--" belong to the feature above them and show indented under it. On phones one plan
 * is compared at a time, picked above the table.
 *
 * @param {Array}  plans     Plans in column order, each with title and features.
 * @param {string} featured  Id of the plan to highlight.
 */
export default function FeatureComparison({ plans, featured }) {
  const [shown, setShown] = useState(
    String(featured || (plans[plans.length - 1] || {}).id)
  );
  const [openTip, setOpenTip] = useState(null);

  // Rows: the features of the plan that has the most, then any the others add, in Freemius's order.
  const rows = [];
  const seen = {};
  const byFeatureCount = [...plans].sort(
    (a, b) => (b.features || []).length - (a.features || []).length
  );

  for (const plan of byFeatureCount) {
    for (const feature of plan.features || []) {
      if (!seen[feature.id] && feature.title) {
        seen[feature.id] = true;
        rows.push(feature);
      }
    }
  }

  const isSub = title => /^\s*--/.test(title);
  const isModule = title => /^\s*\*/.test(title);
  const usesStars = rows.some(feature => isModule(feature.title));
  const clean = title =>
    title
      .replace(/^\s*--\s*/, '')
      .replace(/\*/g, '')
      .trim();
  const formatValue = value =>
    String(value).replace(/\b\d{4,}\b/g, number =>
      Number(number).toLocaleString('en-US')
    );

  const cell = (plan, feature) => {
    const own = (plan.features || []).find(item => item.id == feature.id);

    if (!own) {
      return (
        <Fragment>
          <span className="fsp-compare-no" aria-hidden="true">
            –
          </span>
          <span className="fsp-sr">Not included</span>
        </Fragment>
      );
    }

    if (
      own.value !== null &&
      own.value !== undefined &&
      String(own.value).trim() !== ''
    ) {
      return (
        <span className="fsp-compare-value">{formatValue(own.value)}</span>
      );
    }

    return (
      <Fragment>
        <span className="fsp-compare-yes" aria-hidden="true">
          <Icon icon={['fas', 'check']} />
        </span>
        <span className="fsp-sr">Included</span>
      </Fragment>
    );
  };

  return (
    <section className="fsp-compare" id="fsp-compare">
      <h2 className="fsp-compare-title">Compare plans</h2>
      <p className="fsp-compare-lead">
        Everything each plan includes. Point at{' '}
        <Icon icon={['fas', 'question-circle']} /> to see what a feature does.
      </p>

      <div className="fsp-compare-picker" role="group" aria-label="Plan">
        {plans.map(plan => (
          <button
            type="button"
            key={plan.id}
            className={
              'fsp-compare-pick' +
              (String(plan.id) === shown ? ' is-active' : '')
            }
            aria-pressed={String(plan.id) === shown}
            onClick={() => setShown(String(plan.id))}
          >
            {plan.title}
          </button>
        ))}
      </div>

      <table className="fsp-compare-table" data-shown={shown}>
        <caption className="fsp-sr">Features by plan</caption>
        <thead>
          <tr>
            <th scope="col" className="fsp-compare-feature">
              Features
            </th>
            {plans.map(plan => (
              <th
                scope="col"
                key={plan.id}
                data-plan={plan.id}
                className={
                  String(plan.id) === String(featured) ? 'is-featured' : ''
                }
              >
                {plan.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((feature, index) => {
            const sub = isSub(feature.title);
            // A module: a "*" title when the product marks its modules that way, otherwise a feature with "--"
            // items under it.
            const hasSubs =
              !sub &&
              (usesStars
                ? isModule(feature.title)
                : rows[index + 1] && isSub(rows[index + 1].title));
            const tip = feature.description ? `fsp-tip-${feature.id}` : null;

            return (
              <tr
                key={feature.id}
                className={(sub ? 'is-sub' : '') + (hasSubs ? ' is-group' : '')}
              >
                <th scope="row" className="fsp-compare-feature">
                  <span
                    className={
                      'fsp-compare-name' +
                      (openTip === feature.id ? ' is-open' : '')
                    }
                  >
                    {/* The icon stays with the last word, so a wrapped label never leaves it alone. */}
                    {clean(feature.title).split(' ').slice(0, -1).join(' ')}{' '}
                    <span className="fsp-compare-last">
                      {clean(feature.title).split(' ').slice(-1)[0]}
                      {tip && (
                        <button
                          type="button"
                          className="fsp-compare-tip"
                          aria-describedby={tip}
                          aria-label={`What is ${clean(feature.title)}?`}
                          onClick={() =>
                            setOpenTip(
                              openTip === feature.id ? null : feature.id
                            )
                          }
                        >
                          <Icon icon={['fas', 'question-circle']} />
                        </button>
                      )}
                    </span>
                    {tip && (
                      <span
                        className="fsp-compare-tip-text"
                        role="tooltip"
                        id={tip}
                      >
                        {feature.description}
                      </span>
                    )}
                  </span>
                </th>
                {plans.map(plan => (
                  <td
                    key={plan.id}
                    data-plan={plan.id}
                    className={
                      (String(plan.id) === String(featured)
                        ? 'is-featured'
                        : '') + (String(plan.id) === shown ? ' is-shown' : '')
                    }
                  >
                    {cell(plan, feature)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
