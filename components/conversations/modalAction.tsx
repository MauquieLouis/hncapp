import React from "react-native";
import { Modal, ModalBackdrop, ModalContent } from "@/components/ui/modal";
import { Text } from "@/components/ui/text";

const ModalAction = (props: any) => {

    return(
        <Modal isOpen={props.isOpen} onClose={props.onClose}>
            <ModalBackdrop/>
            <ModalContent style={{position:"absolute", left:0, top: props.modalActionPosition}}>
                <Text>ACTION MODAL</Text>
            </ModalContent>
        </Modal>
    );
}

export default ModalAction;