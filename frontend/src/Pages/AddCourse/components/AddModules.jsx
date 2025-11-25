// The AddModules component allows users to manage a list of modules, including adding, renaming, reordering, and 
// deleting them. It uses useState for module data and displays an alert tip. Modules can be arranged in increasing
// complexity, and changes are passed to the parent component via setModuleData.
import { useEffect, useState } from "react";
import { Alert, Badge, Button, ButtonGroup, FloatingLabel, Form, ListGroup } from "react-bootstrap";

const AddModules = ({ setModuleData }) => {
    const [modules, setModules] = useState([]);
    const [showTip, setShowTip] = useState(true);

    useEffect(() => {
        setModuleData(modules);
    }, [modules]);

    const moveModule = (idx, delta) => {
        const tgtIdx = idx + delta;
        if (tgtIdx < 0 || tgtIdx > modules.length - 1) return;
        var temp = [...modules];
        const [removed] = temp.splice(idx, 1);
        temp.splice(tgtIdx, 0, removed);
        setModules(temp);
    }

    return (
        <>
            <h3 className="mt-2">Modules</h3>
            {showTip && <Alert dismissible onClose={() => setShowTip(false)} variant='info'>
                Please arrange the modules in increasing order of complexity.
            </Alert>}
            <ListGroup>
                {modules.map((module, idx) => (
                    <ListGroup.Item key={idx} style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
                        <Badge bg="secondary">{idx + 1}</Badge>
                        <FloatingLabel style={{ flexGrow: 1 }} label="Module Name">
                            <Form.Control
                                type="text"
                                value={module.name}
                                placeholder=""
                                onChange={(e) => {
                                    setModules(
                                        modules.map((m, i) => i === idx
                                            ? { ...m, name: e.target.value } : m)
                                    );
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') e.preventDefault();
                                }}
                            />
                        </FloatingLabel>
                        <ButtonGroup vertical>
                            <Button size="sm" disabled={idx === 0}
                                onClick={() => moveModule(idx, -1)}
                            >
                                <i className="fa fa-chevron-up"></i>
                            </Button>
                            <Button size="sm" disabled={idx === modules.length - 1}
                                onClick={() => moveModule(idx, +1)}
                            >
                                <i className="fa fa-chevron-down"></i>
                            </Button>
                        </ButtonGroup>
                        <Button variant="danger"
                            onClick={() => {
                                setModules(modules.filter((_, i) => i !== idx));
                            }}
                        >
                            <i className="fa fa-trash"></i>
                        </Button>
                    </ListGroup.Item>
                ))}
                <ListGroup.Item action active onClick={(e) => {
                    setModules([
                        ...modules,
                        {
                            name: '',
                        }
                    ]);
                    e.preventDefault();
                }}>
                    + Add Module
                </ListGroup.Item>
            </ListGroup>
        </>
    );
}

export default AddModules;
