import {Cell, Sender, SenderArguments} from "@ton/core";
import {useTonConnectUI} from "@tonconnect/ui-react";

export function useTonConnect(): { sender: Sender, connected: boolean } {
    const [tonConnectUI] = useTonConnectUI();

    return {
        sender: {
            send: async (args: SenderArguments) => {
                try {
                    const res = await tonConnectUI.sendTransaction({
                        messages: [{
                            address: args.to.toString(),
                            amount: args.value.toString(),
                            payload: args.body?.toBoc().toString("base64")
                        }],
                        validUntil: Date.now() + 60 * 1000 // 60 секунд на подтверждение
                    }, {
                        modals: 'all',
                        notifications: 'all'
                    });
                    console.log("TX RES:", res);

                    const cell = Cell.fromBase64(res.boc)
                    const buffer = cell.hash();
                    const hashHex = buffer.toString('hex');
                    console.log("TX HASH:", hashHex)
                    // TODO: надо показывать пользователю хеш транзакции
                    // TODO: надо закрывать модальное окно прогресса

                    return Promise.resolve();
                } catch (err) {
                    tonConnectUI.modal.close();
                    tonConnectUI.closeModal();
                    tonConnectUI.closeSingleWalletModal();
                    console.log("ERR send:", err);
                    return Promise.reject(err);
                }
            }
        },
        connected: tonConnectUI.connected
    };
}