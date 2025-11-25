// The AddTopics component allows users to manage topics by adding, editing, reordering, and deleting them. 
// It associates topics with modules and tracks their descriptions. It updates the parent component via 
// setTopicsData and provides a word count for topic descriptions, offering guidance on arranging topics by complexity.
import { useEffect, useState } from "react";
import { Alert, Badge, Button, ButtonGroup, FloatingLabel, Form, ListGroup } from "react-bootstrap";
import { getWordCount } from '../../../lib/utils';

const AddTopics = ({ modules, setTopicsData }) => {
    const [topics, setTopics] = useState([]);
    const [showTip, setShowTip] = useState(true);
    const [_modules, setModules] = useState([]);

    useEffect(() => {
        const temp = [...topics];
        const lenChanged = modules.length !== _modules.length;
        temp.forEach((t) => {
            const tgtName = _modules[t.moduleIdx]?.name ?? null;
            const sameNameIdx = modules.findIndex((m) => m.name === tgtName);
            t.moduleIdx = (lenChanged && sameNameIdx === -1)
                ? -1 : (sameNameIdx === -1 ? t.moduleIdx : sameNameIdx);
        });
        setTopics(temp);
        setModules(modules);
    }, [modules]);

    useEffect(() => {
        setTopicsData(topics);
    }, [topics]);

    const moveTopic = (idx, delta) => {
        const tgtIdx = idx + delta;
        if (tgtIdx < 0 || tgtIdx > topics.length - 1) return;
        var temp = [...topics];
        const [removed] = temp.splice(idx, 1);
        temp.splice(tgtIdx, 0, removed);
        setTopics(temp);
    }

    return (
        <>
            <h3 className="mt-2">Topics</h3>
            {showTip && <Alert dismissible onClose={() => setShowTip(false)} variant='info'>
                Please arrange the topics in increasing order of complexity.
            </Alert>}
            <ListGroup>
                {topics.map((topic, idx) => (
                    <ListGroup.Item key={idx} style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
                        <Badge bg='secondary'>{idx + 1}</Badge>
                        <div style={{ flexGrow: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
                                <FloatingLabel style={{ flexGrow: 1 }} label='Topic Name'>
                                    <Form.Control
                                        type='text'
                                        value={topic.name}
                                        placeholder=''
                                        onChange={(e) => {
                                            setTopics(
                                                topics.map((t, i) => i === idx
                                                    ? { ...t, name: e.target.value } : t)
                                            );
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') e.preventDefault()
                                        }}
                                    />
                                </FloatingLabel>
                                <FloatingLabel style={{ flexGrow: 1 }} label='Module'>
                                    <Form.Select
                                        value={topic.moduleIdx}
                                        onChange={(e) => {
                                            setTopics(
                                                topics.map((t, i) => i === idx
                                                    ? { ...t, moduleIdx: e.target.value } : t)
                                            );
                                        }}
                                    >
                                        <option value={-1} hidden>Select Module</option>
                                        {_modules.map((m, i) => (
                                            m.name !== null && m.name !== '' &&
                                            <option key={i} value={i}>{m.name}</option>
                                        ))}
                                    </Form.Select>
                                </FloatingLabel>
                                <ButtonGroup vertical>
                                    <Button disabled={idx === 0} size="sm"
                                        onClick={() => moveTopic(idx, -1)}>
                                        <i className="fa fa-chevron-up"></i>
                                    </Button>
                                    <Button disabled={idx === topics.length - 1} size="sm"
                                        onClick={() => moveTopic(idx, +1)}>
                                        <i className="fa fa-chevron-down"></i>
                                    </Button>
                                </ButtonGroup>
                                <Button variant='danger' onClick={() => {
                                    setTopics(topics.filter((_, i) => i !== idx));
                                }}>
                                    <i className="fa fa-trash"></i>
                                </Button>
                            </div>
                            <FloatingLabel
                                className='mt-1'
                                label={`Topic Description (${getWordCount(topic.description)}/50)`}
                            >
                                <Form.Control
                                    as='textarea'
                                    value={topic.description}
                                    style={{ height: '150px' }}
                                    placeholder=''
                                    onChange={(e) => {
                                        setTopics(
                                            topics.map((t, i) => i === idx
                                                ? { ...t, description: e.target.value } : t)
                                        );
                                    }}
                                />
                            </FloatingLabel>
                        </div>
                    </ListGroup.Item>
                ))}
                <ListGroup.Item action active onClick={(e) => {
                    setTopics([
                        ...topics,
                        {
                            name: '',
                            moduleIdx: -1,
                            description: '',
                        },
                    ]);
                    e.preventDefault();
                }}>
                    + Add Topic
                </ListGroup.Item>
            </ListGroup>
        </>
    );
}

export default AddTopics;
