import isPlainObject from 'lodash/isPlainObject';
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

interface Props {
  value: unknown;
  onCloseClick: () => void;
}

const PreviewModal: FC<Props> = ({ value, onCloseClick }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!modalRef.current) {
      return;
    }
    const elem = modalRef.current;
    $(elem)
      .modal({
        context: 'body',
        closable: false,
        detachable: false,
        onDeny: () => {
          onCloseClick();
        },
      })
      .modal('show');
    return () => {
      $(elem).modal('hide');
    };
  }, [modalRef, onCloseClick]);

  const getPreviewValue = useCallback(
    (type: string | null) => {
      try {
        switch (type) {
          case 'plain':
            return isPlainObject(value) ? JSON.stringify(value) : (value as string);
          case 'json':
            return <pre>{JSON.stringify(value, null, 2)}</pre>;
          default:
            return value as string;
        }
      } catch {
        return 'Not valid format';
      }
    },
    [value],
  );

  const onClick = useCallback((type) => setSelected(type), []);

  const items = [
    { type: 'plain', name: 'Plain Text', default: true },
    { type: 'json', name: 'JSON' },
  ];

  return (
    <div className="ui modal" ref={modalRef}>
      <div className="header">Content Preview</div>
      <div className="content">
        <div className="ui fluid two item menu">
          {items.map((item) => {
            const className = classNames({
              item: true,
              active: (!selected && item.default) || selected === item.type,
            });

            return (
              <a key={item.type} onClick={() => onClick(item.type)} className={className}>
                {item.name}
              </a>
            );
          })}
        </div>
        <div className="ui segment">
          <div style={{ maxHeight: '500px', overflowY: 'scroll' }}>
            {getPreviewValue(selected || 'plain')}
          </div>
        </div>
      </div>
      <div className="actions">
        <div className="small ui black deny right button" tabIndex={0}>
          Close
        </div>
      </div>
    </div>
  );
};

PreviewModal.displayName = 'PreviewModal';
export default PreviewModal;
