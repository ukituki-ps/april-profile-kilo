import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Стек',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Go (REST), React, Temporal, Keycloak, PostgreSQL, Redis/Asynq — см.{' '}
        <code>docs/AGENT_ARCHITECTURE_CONTEXT.md</code>.
      </>
    ),
  },
  {
    title: 'Контракт API',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        OpenAPI в <code>openapi/openapi.yaml</code>; после <code>make compose-up</code> —{' '}
        <code>/swagger/</code> и сырой YAML под <code>/openapi/</code>.
      </>
    ),
  },
  {
    title: 'C4 и ADR',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Structurizr Lite (порт 8091) и каталог ADR в <code>docs/adr/</code>, раздел на сайте{' '}
        <code>/adr/</code>.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
