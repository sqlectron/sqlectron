import React, { FC, useEffect, useRef } from 'react';
import { DB_CLIENTS } from '../api';

interface Props {
  client: string;
  infos: string[];
  onCloseClick: () => void;
}

const ServerDBClientInfoModal: FC<Props> = ({ client, infos, onCloseClick }) => {
  const ref = useRef<HTMLDivElement>(null);

  const dbClient = DB_CLIENTS.find((item) => item.key === client);

  if (!dbClient) {
    throw new Error('Unknown client');
  }

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const elem = ref.current;
    $(elem)
      .modal({
        closable: true,
        detachable: false,
        allowMultiple: true,
        observeChanges: true,
        onHidden: () => onCloseClick(),
      })
      .modal('show');
    return () => {
      $(elem).modal('hide');
    };
  }, [ref, onCloseClick]);

  return (
    <div id="server-modal" className="ui modal" ref={ref}>
      <div className="header">{dbClient.name} Query Information</div>
      <div className="content">
        <p>Some particularities about queries on {dbClient.name} you should know:</p>
        <div className="ui bulleted list">
          {infos.map((info, idx) => (
            <div key={idx} className="item">
              {info}
            </div>
          ))}
        </div>
        <ul />
      </div>
    </div>
  );
};

ServerDBClientInfoModal.displayName = 'ServerDBClientInfoModal';
export default ServerDBClientInfoModal;
